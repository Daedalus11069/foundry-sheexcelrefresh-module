import VueSheet from "./libs/vue/VueSheet";
import VueSheetTemplate from "./scripts/GlobalConfigMenu.vue";

export default class SheexcelConfigForm extends VueSheet(FormApplication) {
  get vueComponent() {
    return VueSheetTemplate;
  }
  getVueContext() {
    return { data: { cssClass: "sheexcel-sheet" } };
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sheexcelrefresh"],
      width: 1200,
      height: 700,
      resizable: true
    });
  }

  constructor(...args) {
    super(...args);
    const globalConfig =
      game.settings.get("sheexcelrefresh", "globalConfig") || {};
    this._sheetId = globalConfig.sheetId || "";
    this._sheetUrl = globalConfig.sheetUrl || "";
    this._currentZoomLevel = globalConfig.zoomLevel || 100;
    this._sidebarCollapsed = globalConfig.sidebarCollapsed || false;
    this._activeTab = globalConfig.activeTab || "settings";
    this._cellReferences = globalConfig.cellReferences || [];
    this._ranges = globalConfig.ranges || [];
    this._adjustedRanges = globalConfig.adjustedRanges || [];
    this._sheetId = globalConfig.sheetId || null;
    this._currentSheetName = globalConfig.currentSheetName || null;
    this._sheetNames = globalConfig.sheetNames || [];
    this._iframe = null;
  }
  getData() {
    const data = super.getData();
    const globalConfig =
      game.settings.get("sheexcelrefresh", "globalConfig") || {};
    data.sheetUrl = globalConfig.sheetUrl || "";
    data.sheetId = globalConfig.sheetId || "";
    data.zoomLevel = this._currentZoomLevel;
    data.hideMenu = globalConfig.hideMenu || true;
    data.sidebarCollapsed = this._sidebarCollapsed;
    data.activeTab = this._activeTab;
    data.sheetNames = this._sheetNames.length > 1 ? this._sheetNames : null;
    data.currentSheetName = this._currentSheetName;
    data.sheetId = this._sheetId;
    data.cellReferences = this._cellReferences || [];
    data.ranges = this._ranges || [];
    return data;
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

  _updateObject(data) {
    if (!game.user.isGM) return;
    game.settings.set("sheexcelrefresh", "globalConfig", data);
  }
}
