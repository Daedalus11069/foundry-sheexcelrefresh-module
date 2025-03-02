import VueSheet from "./libs/vue/VueSheet";
import VueSheetTemplate from "./scripts/OverridableReferencesMenu.vue";

export default class SheexcelOverridableReferencesForm extends VueSheet(
  FormApplication
) {
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
    const overridableReferenceKeys =
      game.settings.get("sheexcelrefresh", "overridableReferenceKeys") || [];
    const { cellReferences = [] } = game.settings.get(
      "sheexcelrefresh",
      "globalConfig"
    ) || { cellReferences: [] };
    this._availableKeys = cellReferences.slice(0);
    this._referenceKeys = overridableReferenceKeys.slice(0);
  }
  getData() {
    const data = super.getData();
    const overridableReferenceKeys =
      game.settings.get("sheexcelrefresh", "overridableReferenceKeys") || [];
    const { cellReferences = [] } = game.settings.get(
      "sheexcelrefresh",
      "globalConfig"
    ) || { cellReferences: [] };
    this._availableKeys = cellReferences.slice(0);
    this._referenceKeys = overridableReferenceKeys.slice(0);
    data.availableKeys = this._availableKeys;
    data.referenceKeys = this._referenceKeys;
    return data;
  }

  _updateObject(data) {
    if (!game.user.isGM) return;
    game.settings.set(
      "sheexcelrefresh",
      "overridableReferenceKeys",
      data.referenceKeys
    );
  }
}
