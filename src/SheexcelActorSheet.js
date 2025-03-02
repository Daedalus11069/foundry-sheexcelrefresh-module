import VueSheet from "./libs/vue/VueSheet";
import VueSheetTemplate from "./scripts/SheetTemplate.vue";

export default class SheexcelActorSheet extends VueSheet(ActorSheet) {
  get vueComponent() {
    return VueSheetTemplate;
  }
  getVueContext() {
    return { data: { cssClass: "sheexcel-sheet" } };
  }
  constructor(...args) {
    super(...args);
    this._allowOverride =
      this.actor.getFlag("sheexcelrefresh", "allowOverride") || false;
    this._currentZoomLevel =
      this.actor.getFlag("sheexcelrefresh", "zoomLevel") || 100;
    this._sidebarCollapsed =
      this.actor.getFlag("sheexcelrefresh", "sidebarCollapsed") || false;
    this._activeTab =
      this.actor.getFlag("sheexcelrefresh", "activeTab") || "settings";
    this._cellReferences =
      this.actor.getFlag("sheexcelrefresh", "cellReferences") || [];
    this._overridableCellReferences =
      this.actor.getFlag("sheexcelrefresh", "overridableCellReferences") || [];
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
    data.allowOverride =
      this.actor.getFlag("sheexcelrefresh", "allowOverride") || false;
    data.sidebarCollapsed = this._sidebarCollapsed;
    data.activeTab = this._activeTab;
    data.sheetNames = this._sheetNames.length > 1 ? this._sheetNames : null;
    data.currentSheetName = this._currentSheetName;
    data.sheetId = this._sheetId;
    data.cellReferences = this._cellReferences || [];
    data.overridableCellReferences = this._overridableCellReferences || [];
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
        sheetTabs.forEach(tab => {
          const nameElement = tab.children[0].children[0].children[0];
          if (nameElement) {
            const sheetName = nameElement.innerHTML.trim();
            if (tab.classList.contains("docs-sheet-active-tab")) {
              this._currentSheetName = sheetName;
            }
          }
        });
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
    if (!game.user.isGM || !this.actor.isOwner) return;
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
    if (game.user.isGM) {
      flags.allowOverride = this._allowOverride;
    }
    if (
      game.settings.get("sheexcelrefresh", "individualOverrideAllowed") ||
      this._allowOverride
    ) {
      flags.overridableCellReferences = this._overridableCellReferences;
    } else {
      flags.overridableCellReferences = [];
    }
    await this.actor.update({
      "flags.sheexcelrefresh": flags
    });
  }

  getSheexcelValue(keyword) {
    return this.actor.system.sheexcelrefresh[keyword] || null;
  }
}
