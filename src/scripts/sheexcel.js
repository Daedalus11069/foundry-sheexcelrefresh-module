import VueSheet from "../libs/vue/VueSheet";
import VueSheetTemplate from "./sheet-template.vue";

Hooks.once("init", async function () {
  Actors.registerSheet("sheexcelrefresh", SheexcelActorSheet, {
    label: "Sheexcel",
    types: ["character", "npc", "creature", "vehicle"],
    makeDefault: false
  });

  const originalPrepareData = Actor.prototype.prepareData;
  Actor.prototype.prepareData = function () {
    originalPrepareData.call(this);

    this.system.sheexcelrefresh = {};
    for (const ref of this.getFlag("sheexcelrefresh", "cellReferences") || []) {
      if (ref.keyword && ref.value !== undefined) {
        this.system.sheexcelrefresh[ref.keyword] = ref.value;
      }
    }
  };

  Actor.prototype._fetchCellValues = async function (cells = {}) {
    const sheetId = this.getFlag("sheexcelrefresh", "sheetId");

    const data = {};
    const sheetKeys = Object.keys(cells);
    for await (const sheetName of sheetKeys) {
      const cellRefs = cells[sheetName].map(({ cell }) => cell).join(",");

      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
        sheetName
      )}&range=${cellRefs}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      data[sheetName] = (await response.text())
        .trim()
        .split(",")
        .map(cellResult => cellResult.replace(/^"(.*)"$/, "$1"))
        .map((cellResult, idx) => ({
          keyword: cells[sheetName][idx].keyword,
          text: cellResult
        }));
    }

    return data;
  };

  Actor.prototype.refreshCellValues = async function () {
    if (this.system.sheexcelrefresh) {
      const sheexcelData = {};
      const cells = {};
      for await (const ref of this.getFlag(
        "sheexcelrefresh",
        "cellReferences"
      ) || []) {
        if (ref.keyword !== "" && ref.cell !== "") {
          if (typeof cells[ref.sheet] === "undefined") {
            cells[ref.sheet] = [];
          }
          cells[ref.sheet].push({ keyword: ref.keyword, cell: ref.cell });
        }
      }
      const data = await this._fetchCellValues(cells);
      for (const sheetName of Object.keys(data)) {
        const cellResults = data[sheetName];
        for (const cellResult of cellResults) {
          sheexcelData[cellResult.keyword] = cellResult.text;
        }
      }
      await this.update({
        "system.sheexcelrefresh": sheexcelData
      });
      return null;
    }
    return null;
  };

  game.sheexcelrefresh = {
    getSheexcelValue: (actorId, keyword) => {
      const actor = game.actors.get(actorId);
      if (actor && actor.system.sheexcelrefresh) {
        return {
          value: actor.system.sheexcelrefresh[keyword] || null,
          actor: actor
        };
      }
      return null;
    },
    refreshAllCellValues: async actorId => {
      const actor = game.actors.get(actorId);
      if (actor && actor.system.sheexcelrefresh) {
        await actor.refreshCellValues();
        return null;
      }
      return null;
    }
  };
});

class SheexcelActorSheet extends VueSheet(ActorSheet) {
  get vueComponent() {
    return VueSheetTemplate;
  }
  getVueContext() {
    return { data: { cssClass: "sheexcel-sheet" } };
  }
  constructor(...args) {
    super(...args);
    this._currentZoomLevel =
      this.actor.getFlag("sheexcelrefresh", "zoomLevel") || 100;
    this._sidebarCollapsed =
      this.actor.getFlag("sheexcelrefresh", "sidebarCollapsed") || false;
    this._cellReferences =
      this.actor.getFlag("sheexcelrefresh", "cellReferences") || [];
    this._sheetId = this.actor.getFlag("sheexcelrefresh", "sheetId") || null;
    this._currentSheetName =
      this.actor.getFlag("sheexcelrefresh", "currentSheetName") || null;
    this._sheetNames =
      this.actor.getFlag("sheexcelrefresh", "sheetNames") || [];
    this._iframe = null;
    this._refetchAllCellValues();
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sheet", "actor", "sheexcelrefresh"],
      template: "modules/sheexcelrefresh/templates/sheet-template.html",
      width: 1200,
      height: 700,
      resizable: true,
      tabs: [
        {
          navSelector: ".sheexcel-sheet-tabs",
          contentSelector: ".sheexcel-sidebar",
          initial: "settings"
        }
      ]
    });
  }

  getData() {
    const data = super.getData();
    data.sheetUrl = this.actor.getFlag("sheexcelrefresh", "sheetUrl") || "";
    data.zoomLevel = this._currentZoomLevel;
    data.hideMenu = this.actor.getFlag("sheexcelrefresh", "hideMenu") || true;
    data.sidebarCollapsed = this._sidebarCollapsed;
    data.cellReferences = this._cellReferences;
    data.sheetNames = this._sheetNames.length > 1 ? this._sheetNames : null;
    data.currentSheetName = this._currentSheetName;
    data.sheetId = this._sheetId;
    data.adjustedReferences = this._cellReferences.map(cellRef => {
      const sheetNames = this._sheetNames.reduce((acc, name) => {
        acc[name] = name;
        return acc;
      }, {});
      cellRef.sheetNames = sheetNames;
      if (cellRef.value.length > 10) {
        cellRef.value = foundry.utils.duplicate(cellRef.value).slice(0, 10);
      }
      return cellRef;
    });
    return data;
  }

  async _refetchAllCellValues() {
    if (!this._sheetId || !this._currentSheetName) return;

    for (let i = 0; i < this._cellReferences.length; i++) {
      await this._updateCellValue(i);
    }

    const sheexcelData = {};
    for (const ref of this._cellReferences) {
      if (ref.keyword && ref.value !== undefined) {
        sheexcelData[ref.keyword] = ref.value;
      }
    }
    await this.actor.update({ "system.sheexcelrefresh": sheexcelData });
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".sheexcel-sheet-references").click(this._onToggleTab.bind(this));
    html.find(".sheexcel-sheet-settings").click(this._onToggleTab.bind(this));
  }

  _onToggleTab(event) {
    event.preventDefault();
    if (!this._sidebarCollapsed) return;
    this._sidebarCollapsed = false;
    const icon = $(event.currentTarget.parentElement.children[0].children[0]);

    const collapsed = `<svg width="30" height="24" viewBox="0 -4 27 26" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="25" height="20" fill="#eeeeee" stroke="#000000" stroke-width="2"/>
                    <rect x="18" y="1" width="1" height="20" fill="#151515"/>
                </svg>`;
    const expanded = `<svg width="30" height="24" viewBox="0 -4 27 26" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="25" height="20" fill="#eeeeee" stroke="#000000" stroke-width="2"/>
                    <rect x="18" y="1" width="7" height="20" fill="#151515"/>
                </svg>`;
    icon.empty();
    icon.append(this._sidebarCollapsed ? collapsed : expanded);

    const sidebar = this.element.find(".sheexcel-sidebar");

    sidebar.toggleClass("collapsed", this._sidebarCollapsed);
  }

  async _fetchSheetNames() {
    if (!this._sheetId) return;

    const url = `https://docs.google.com/spreadsheets/d/${this._sheetId}/edit`;

    try {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const container = doc.querySelector(".docs-sheet-container-bar");

      if (container) {
        this._sheetNames = [];
        const sheetTabs = container.querySelectorAll(".docs-sheet-tab");

        sheetTabs.forEach(tab => {
          const nameElement = tab.children[0].children[0].children[0];
          if (nameElement) {
            const sheetName = nameElement.innerHTML.trim();
            this._sheetNames.push(sheetName);
          }
        });
        this._currentSheetName = this._sheetNames[0];
      } else {
        console.error("Sheet container not found");
      }
    } catch (error) {
      console.error("Error fetching sheet names:", error);
    }
    return this._sheetNames;
  }

  async _fetchCellValue(sheetId, sheetName, cellRef) {
    if (cellRef === "") return "";

    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
      sheetName
    )}&range=${cellRef}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = (await response.text()).trim().replace(/^"(.*)"$/, "$1");
    return text;
  }

  async _updateCellValue(i) {
    const ref = this._cellReferences[i];
    const value = await this._fetchCellValue(
      this._sheetId,
      ref.sheet || this._currentSheetName,
      ref.cell
    );
    this._cellReferences[i].value = value;
  }

  async close(...args) {
    await this._saveFlags();

    return super.close(...args);
  }

  async _saveFlags() {
    if (!game.user.isGM && !this.actor.isOwner) return;
    const flags = {
      zoomLevel: this._currentZoomLevel,
      sidebarCollapsed: this._sidebarCollapsed,
      cellReferences: this._cellReferences,
      currentSheetName: this._currentSheetName,
      sheetNames: this._sheetNames
    };
    await this.actor.update({
      "flags.sheexcelrefresh": flags
    });
  }

  getSheexcelValue(keyword) {
    return this.actor.system.sheexcelrefresh[keyword] || null;
  }
}
