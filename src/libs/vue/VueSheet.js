/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Mixin for empowering Applications with Sheets!
 */

import { createApp, reactive } from "vue";
import { RootContext } from "./SheetContext";

export default function VueSheet(base) {
  return class extends base {
    form;

    /**
     * Handle for the active Vue app.
     */
    vueApp;

    /**
     * Reactive context data that is injected into the active Vue app.
     */
    vueContext;

    /**
     * This component must be implemented by children to define the Vue component to use for the sheet.
     */
    get vueComponent() {
      return null;
    }

    /**
     * Similar in purpose to {@link Application.getData}, but with some potentially Vue-specific context data.
     */
    async getVueContext() {
      return undefined;
    }

    async _renderInner(_data, options) {
      const vueContext = await this.getVueContext();

      // Instantiate our form object.
      if (!this.form) {
        const form = document.createElement("form");

        const cssClass =
          vueContext?.data?.cssClass ??
          (options?.classes && options?.classes)?.join(" ") ??
          "";

        form.className = `${cssClass} vue-app`;
        form.setAttribute("autocomplete", "off");

        this.form = form;
      }

      // Verify our reactive context is set up
      if (!this.vueContext && vueContext) {
        this.vueContext = reactive(vueContext);
      }

      // Initialize the vue app if necessary
      if (!this.vueApp) {
        this.vueApp = createApp(this.vueComponent);
        this.vueApp.provide(RootContext, this.vueContext);
        this.vueApp.provide("sheet", this);
        this.vueApp.provide("actor", this.actor);

        this.vueApp.mount(this.form);
      } else if (this.vueContext && vueContext) {
        // Update context & actor data injected into the existing Vue app
        for (const key of Object.keys(vueContext)) {
          this.vueContext[key] = vueContext[key];
        }
      }

      return $(this.form);
    }

    /**
     * Unmount and destroy the sfc app for this sheet on close.
     */
    async close(options = {}) {
      this.vueApp?.unmount();
      this.vueApp = undefined;
      this.vueContext = undefined;

      await super.close(options);
    }

    /**
     * Deactivate JQuery event listeners to prevent them triggering multiple times.
     */
    deactivateListeners(html) {
      html.find("img[data-edit]").off("click");
      html.find("input,select,textarea").off("change");
      html.find("button.file-picker").off("click");
    }

    activateListeners(html) {
      this.deactivateListeners(html);

      super.activateListeners(html);
    }

    _activateEditor(_) {}
    async saveEditor(name, _ = {}) {}
  };
}
