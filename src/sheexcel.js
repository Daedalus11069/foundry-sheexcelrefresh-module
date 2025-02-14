import { inferSchema, initParser } from "udsv";
import parse from "csv-simple-parser";
import { dollar as phrase } from "paraphrase";
import VueSheet from "./libs/vue/VueSheet";
import { stringToIdentifier } from "./libs/utils";
import VueSheetTemplate from "./scripts/sheet-template.vue";

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
      if (ref.keyword && ref.keyword !== "" && ref.value !== undefined) {
        this.system.sheexcelrefresh[ref.keyword] = ref.value;
      }
    }
    const adjustedRanges =
      this.getFlag("sheexcelrefresh", "adjustedRanges") || [];
    for (const { name, data } of adjustedRanges) {
      if (name !== "") {
        this.system.sheexcelrefresh[name] = data;
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

      let csvStr = (await response.text()).trim();
      if (csvStr.split(",").length === 1) {
        csvStr = csvStr.replace(/^"(.*)"$/, "$1");
      }

      const csvData = initParser(
        inferSchema(cellRefs + "\n" + csvStr)
      ).stringObjs(cellRefs + "\n" + csvStr)[0];

      data[sheetName] = Object.keys(csvData).reduce((carry, cellRef) => {
        const foundCell = cells[sheetName].find(({ cell }) => cell === cellRef);
        carry.push({
          keyword: foundCell.keyword,
          text: csvData[cellRef],
          cell: foundCell.cell
        });
        return carry;
      }, []);
    }

    return data;
  };

  Actor.prototype.refreshCellValues = async function () {
    if (this.system.sheexcelrefresh) {
      const sheexcelData = {};
      const cells = {};
      const updatedReferences = [];
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
          updatedReferences.push({
            sheet: sheetName,
            cell: cellResult.cell,
            keyword: cellResult.keyword,
            value: cellResult.text
          });
        }
      }

      await this.setFlag(
        "sheexcelrefresh",
        "cellReferences",
        updatedReferences
      );
      await this.update({
        "system.sheexcelrefresh": sheexcelData
      });
    }
  };

  Actor.prototype._fetchRangeValues = async function (ranges = []) {
    const sheetId = this.getFlag("sheexcelrefresh", "sheetId");

    const data = {};

    for await (const range of ranges) {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
        range.sheet
      )}&range=${range.cellRange}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const csvStr = (await response.text()).trim();
      const csvData = parse(csvStr, {
        header: false
      });

      data[range.name] = csvData.reduce((carry, row) => {
        const rowData = range.headers.reduce((headerCarry, header) => {
          let colData = row[header.index].trim();
          if (
            typeof header.default !== "undefined" &&
            header.default !== "" &&
            (colData === "" ||
              colData === null ||
              typeof colData === "undefined")
          ) {
            colData = header.default;
          }
          if (header.type === "number") {
            colData = window.parseFloat(colData);
          } else {
            if (header.options.formatValue !== "") {
              colData = phrase(header.options.formatValue, { Value: colData });
            }
            if (header.options.lowerCase) {
              colData = colData.toLowerCase();
            }
            if (header.options.identifier) {
              colData = stringToIdentifier(colData);
            }
          }
          headerCarry[header.name] = colData;
          return headerCarry;
        }, {});
        carry.push(rowData);
        return carry;
      }, []);
    }

    return data;
  };

  Actor.prototype.refreshRangeValues = async function () {
    if (this.system.sheexcelrefresh) {
      const sheexcelData = {};
      const ranges = this.getFlag("sheexcelrefresh", "ranges") || [];
      const adjustedRanges = [];
      const data = await this._fetchRangeValues(ranges);
      for (const { name } of ranges) {
        sheexcelData[name] = data[name];
        adjustedRanges.push({ name, data: data[name] });
      }

      await this.setFlag("sheexcelrefresh", "adjustedRanges", adjustedRanges);
      await this.update({
        "system.sheexcelrefresh": sheexcelData
      });
    }
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
      }
    },
    refreshAllRangeValues: async actorId => {
      const actor = game.actors.get(actorId);
      if (actor && actor.system.sheexcelrefresh) {
        await actor.refreshRangeValues();
      }
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
    this._activeTab =
      this.actor.getFlag("sheexcelrefresh", "activeTab") || "settings";
    this._cellReferences =
      this.actor.getFlag("sheexcelrefresh", "cellReferences") || [];
    this._ranges = this.actor.getFlag("sheexcelrefresh", "ranges") || [];
    this._adjustedRanges =
      this.actor.getFlag("sheexcelrefresh", "adjustedRanges") || [];
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
      width: 1200,
      height: 700,
      resizable: true
    });
  }

  getData() {
    const data = super.getData();
    data.sheetUrl = this.actor.getFlag("sheexcelrefresh", "sheetUrl") || "";
    data.sheetId = this.actor.getFlag("sheexcelrefresh", "sheetId") || "";
    data.zoomLevel = this._currentZoomLevel;
    data.hideMenu = this.actor.getFlag("sheexcelrefresh", "hideMenu") || true;
    data.sidebarCollapsed = this._sidebarCollapsed;
    data.activeTab = this._activeTab;
    data.sheetNames = this._sheetNames.length > 1 ? this._sheetNames : null;
    data.currentSheetName = this._currentSheetName;
    data.sheetId = this._sheetId;
    data.cellReferences = this._cellReferences || [];
    data.ranges = this._ranges || [];
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
    super.deactivateListeners(html);
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
      sheetUrl: this._sheetUrl,
      sheetId: this._sheetId,
      zoomLevel: this._currentZoomLevel,
      sidebarCollapsed: this._sidebarCollapsed,
      activeTab: this._activeTab,
      cellReferences: this._cellReferences,
      ranges: this._ranges,
      currentSheetName: this._currentSheetName,
      sheetName: this._currentSheetName,
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
