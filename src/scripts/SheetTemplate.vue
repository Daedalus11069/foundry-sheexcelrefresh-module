<template>
  <div class="sheexcel-sheet-container">
    <header class="sheexcel-sheet-header">
      <h1>{{ actor.name }}</h1>
    </header>
    <section class="sheexcel-sheet-body">
      <div class="sheexcel-main-content">
        <iframe
          class="sheexcel-iframe"
          :style="{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: `top left`,
            width: `${100 * (100 / zoomLevel)}%`,
            height: `${100 * (100 / zoomLevel)}%`
          }"
          :src="iframeSrc"
          frameborder="0"
          v-show="sheetUrl !== ''"
        ></iframe>
        <p v-show="sheetUrl === ''">
          {{ localize("SHEEXCELREFRESH.NoSheetURL") }}
        </p>
      </div>
    </section>
    <nav class="sheexcel-sheet-tabs">
      <a @click="toggleSidebar">
        <div>
          <svg
            width="30"
            height="24"
            viewBox="0 -4 27 26"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="1"
              y="1"
              width="25"
              height="20"
              fill="#eeeeee"
              stroke="#000000"
              stroke-width="2"
            />
            <rect
              x="18"
              y="1"
              width="1"
              height="20"
              fill="#151515"
              v-if="sidebarCollapsed"
            />
            <rect
              x="18"
              y="1"
              width="7"
              height="20"
              fill="#151515"
              v-if="!sidebarCollapsed"
            />
          </svg>
        </div>
      </a>
      <a
        :class="{ active: activeTab === 'references' }"
        :title="localize('SHEEXCELREFRESH.References.CellReferencesTitle')"
        @click="toggleTab('references')"
        v-if="localConfigAllowed || globalOverrideAllowed || allowOverride"
      >
        <div>
          <svg
            width="30"
            height="24"
            viewBox="0 -4 27 26"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="1"
              y="1"
              width="25"
              height="20"
              fill="#262626"
              stroke="#000000"
              stroke-width="2"
            />
            <rect x="5" y="6" width="15" height="2" fill="#eeeeee" />
            <rect x="5" y="10" width="15" height="2" fill="#eeeeee" />
            <rect x="5" y="14" width="15" height="2" fill="#eeeeee" />
          </svg>
        </div>
      </a>
      <a
        :class="{ active: activeTab === 'ranges' }"
        :title="localize('SHEEXCELREFRESH.Ranges.RangesTitle')"
        @click="toggleTab('ranges')"
        v-if="localConfigAllowed"
      >
        <div class="sheexcel-sheet-tab-icon">
          <svg width="30" height="24" viewBox="0 -4 27 26" fill="none">
            <rect
              x="1"
              y="1"
              width="25"
              height="20"
              fill="#262626"
              stroke="#000000"
              stroke-width="2"
            />
            <rect x="5" y="6" width="2" height="2" fill="#eeeeee" />
            <rect x="10" y="6" width="10" height="2" fill="#eeeeee" />

            <rect x="5" y="10" width="2" height="2" fill="#eeeeee" />
            <rect x="10" y="10" width="10" height="2" fill="#eeeeee" />

            <rect x="5" y="14" width="2" height="2" fill="#eeeeee" />
            <rect x="10" y="14" width="10" height="2" fill="#eeeeee" />
          </svg>
        </div>
      </a>
      <a
        :class="{ active: activeTab === 'settings' }"
        :title="localize('SHEEXCELREFRESH.Settings')"
        @click="toggleTab('settings')"
      >
        <div class="sheexcel-sheet-tab-icon">
          <svg
            width="30"
            height="30"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#151515"
              d="M12 8.595C10.1315 8.595 8.595 10.1315 8.595 12C8.595 13.8685 10.1315 15.405 12 15.405C13.8685 15.405 15.405 13.8685 15.405 12C15.405 10.1315 13.8685 8.595 12 8.595ZM22 12.9415V11.0585L19.6615 9.91477C19.5254 9.16677 19.2908 8.44523 18.9754 7.76923L20.2754 5.53846L18.4615 3.72462L16.2308 5.02462C15.5548 4.70923 14.8332 4.47462 14.0852 4.33846L12.9415 2H11.0585L9.91477 4.33846C9.16677 4.47462 8.44523 4.70923 7.76923 5.02462L5.53846 3.72462L3.72462 5.53846L5.02462 7.76923C4.70923 8.44523 4.47462 9.16677 4.33846 9.91477L2 11.0585V12.9415L4.33846 14.0852C4.47462 14.8332 4.70923 15.5548 5.02462 16.2308L3.72462 18.4615L5.53846 20.2754L7.76923 18.9754C8.44523 19.2908 9.16677 19.5254 9.91477 19.6615L11.0585 22H12.9415L14.0852 19.6615C14.8332 19.5254 15.5548 19.2908 16.2308 18.9754L18.4615 20.2754L20.2754 18.4615L18.9754 16.2308C19.2908 15.5548 19.5254 14.8332 19.6615 14.0852L22 12.9415ZM12 16.5C9.51477 16.5 7.5 14.4852 7.5 12C7.5 9.51477 9.51477 7.5 12 7.5C14.4852 7.5 16.5 9.51477 16.5 12C16.5 14.4852 14.4852 16.5 12 16.5Z"
            />
          </svg>
        </div>
      </a>
    </nav>

    <div class="sheexcel-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div
        class="sheexcel-sidebar-tab"
        v-show="activeTab === 'references'"
        v-if="localConfigAllowed || globalOverrideAllowed || allowOverride"
      >
        <div class="sheexcel-references-container">
          <h3>
            <span class="me-2" v-if="limitToCellReferences">
              {{ localize("SHEEXCELREFRESH.References.Override") }}
            </span>
            <span>{{ localize("SHEEXCELREFRESH.References.References") }}</span>
          </h3>
          <SheexcelCellReferences
            v-model="cellReferences"
            v-model:overridableReferences="overridableReferences"
            v-model:system="system"
            :sheetNames
            :limit-to-cell-references="limitToCellReferences"
          />
        </div>
      </div>
      <div
        class="sheexcel-sidebar-tab"
        v-show="activeTab === 'ranges'"
        v-if="localConfigAllowed"
      >
        <div class="sheexcel-ranges-container">
          <h3>{{ localize("SHEEXCELREFRESH.Ranges.Ranges") }}</h3>
          <SheexcelCellRanges v-model="ranges" :sheetNames />
        </div>
      </div>
      <div class="sheexcel-sidebar-tab" v-show="activeTab === 'settings'">
        <h3>{{ localize("SHEEXCELREFRESH.Settings") }}</h3>
        <div class="sheexcel-settings">
          <div class="sheexcel-settings-container">
            <input
              type="text"
              class="sheexcel-setting-url"
              v-model="sheetUrl"
              @input.prevent.stop
              :placeholder="localize('SHEEXCELREFRESH.GoogleSheetURL')"
            />
            <button
              type="button"
              class="sheexcel-setting-update-sheet"
              @click.prevent="onUpdateSheet"
            >
              {{ localize("SHEEXCELREFRESH.UpdateSheet") }}
            </button>
          </div>
          <div class="sheexcel-settings-container">
            <input
              class="sheexcel-setting-zoom-slider"
              type="range"
              min="25"
              max="175"
              v-model="zoomLevel"
              step="5"
            />
            <span class="sheexcel-setting-zoom-value">{{ zoomLevel }}%</span>
          </div>
          <div class="sheexcel-settings-container">
            <input
              class="sheexcel-setting-hide-menu"
              type="checkbox"
              v-model="hideMenu"
            />
            <span>{{ localize("SHEEXCELREFRESH.HideMenu") }}</span>
          </div>
          <div class="sheexcel-settings-container" v-if="isGM">
            <input type="checkbox" v-model="allowOverride" />
            <span>{{ localize("SHEEXCELREFRESH.AllowOverride") }}</span>
          </div>
          <div
            :inert="!localConfigAllowed"
            class="sheexcel-settings-container"
            :class="{ 'opacity-30': !localConfigAllowed }"
          >
            <div class="flex flex-row gap-x-2">
              <div class="basis-6/12">
                <button type="button" @click="onExportConfig">
                  {{ localize("SHEEXCELREFRESH.ExportConfig") }}
                </button>
              </div>
              <div class="basis-6/12">
                <button type="button" @click="open">
                  {{ localize("SHEEXCELREFRESH.ImportConfig") }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, onUnmounted, ref } from "vue";
import { promiseTimeout, useFileDialog } from "@vueuse/core";
import { saveAs } from "file-saver";
import { FileReader } from "@tanker/file-reader";
import { cloneDeep } from "lodash-es";
import { localize } from "../libs/vue/VueHelpers";
import { deepUnref } from "../libs/utils";
import SheexcelCellReferences from "./components/SheexcelCellReferences.vue";
import SheexcelCellRanges from "./components/SheexcelCellRanges.vue";
import { initFlowbite } from "flowbite";

const actor = inject("actor");
const actorSheet = inject("sheet");

const isGM = computed(() => game.user.isGM);

const data = ref(actorSheet.getData());
const localConfigAllowed = ref(
  game.settings.get("sheexcelrefresh", "individualConfigAlllowed") || false
);
const globalOverrideAllowed = ref(
  game.settings.get("sheexcelrefresh", "individualOverrideAllowed") ||
    data.value.globalOverrideAllowed ||
    false
);
const allowOverride = ref(data.value.allowOverride);
const activeTab = ref(data.value.activeTab);
const sheetId = ref(data.value.sheetId);
const sheetUrl = ref(data.value.sheetUrl);
const sheetNames = ref(data.value.sheetNames);
const currentSheetName = ref(data.value.currentSheetName);
const hideMenu = ref(data.value.hideMenu);
const sidebarCollapsed = ref(data.value.sidebarCollapsed);
const zoomLevel = ref(data.value.zoomLevel);
const cellReferences = ref(data.value.cellReferences);
const overridableReferenceKeys =
  game.settings.get("sheexcelrefresh", "overridableReferenceKeys") || [];
const overridableReferences = ref(
  overridableReferenceKeys
    .filter(
      key =>
        cellReferences.value.findIndex(
          reference => reference.keyword === key
        ) >= 0
    )
    .map(key => {
      const reference = data.value.overridableCellReferences.find(
        reference => reference.keyword === key
      );
      if (typeof reference !== "undefined") {
        return cloneDeep(reference);
      }
      return;
    })
    .filter(reference => !!reference)
);
const ranges = ref(data.value.ranges);
const system = ref(
  foundry.utils.duplicate(actorSheet.actor.system.sheexcelrefresh)
);
const limitToCellReferences = computed(() => {
  return globalOverrideAllowed.value || allowOverride.value || false;
});

const { open, onChange } = useFileDialog({
  accept: "*.json",
  multiple: false
});

const iframeSrc = computed(() => {
  return `${sheetUrl.value}?embedded=true&rm=${
    hideMenu.value ? "minimal" : "embedded"
  }`;
});

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

const toggleTab = active => {
  sidebarCollapsed.value = false;
  activeTab.value = active;
};

const onUpdateSheet = async () => {
  if (!sheetUrl.value) {
    sheetId.value = null;
    currentSheetName.value = null;
    sheetNames.value = [];
    return;
  }

  const sheetIdMatch = sheetUrl.value.match(
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
  );
  if (sheetIdMatch) {
    sheetId.value = sheetIdMatch[1];
    actorSheet._sheetId = sheetIdMatch[1];
    await actorSheet._fetchSheetNames();
  }

  actorSheet._sheetUrl = sheetUrl.value;
};

const saveData = async () => {
  actorSheet._activeTab = activeTab.value;
  actorSheet._sheetId = sheetId.value;
  actorSheet._sheetUrl = sheetUrl.value;
  actorSheet._sheetNames = sheetNames.value;
  actorSheet._currentSheetName = currentSheetName.value;
  actorSheet._hideMenu = hideMenu.value;
  actorSheet._sidebarCollapsed = sidebarCollapsed.value;
  actorSheet._zoomLevel = zoomLevel.value;
  actorSheet._cellReferences = cellReferences.value;
  actorSheet._overridableCellReferences = overridableReferences.value;
  actorSheet._ranges = ranges.value;
  if (isGM.value) {
    actorSheet._allowOverride = allowOverride.value;
  }
  await actorSheet._saveFlags();
  await actorSheet.actor.update({ "system.sheexcelrefresh": system.value });
};

const onExportConfig = () => {
  const config = deepUnref({
    activeTab,
    sheetId,
    sheetUrl,
    sheetNames,
    currentSheetName,
    hideMenu,
    sidebarCollapsed,
    zoomLevel,
    cellReferences,
    overridableReferences,
    ranges
  });
  const blob = new Blob([JSON.stringify(config)], {
    type: "application/json;charset=utf-8"
  });
  saveAs(blob, "sheexcelrefresh_config.json");
};

onChange(async fileList => {
  const reader = new FileReader(fileList[0]);
  try {
    const configData = JSON.parse(await reader.readAsText("UTF-8"));
    activeTab.value = configData.activeTab;
    sheetId.value = configData.sheetId;
    sheetUrl.value = configData.sheetUrl;
    sheetNames.value = configData.sheetNames;
    currentSheetName.value = configData.currentSheetName;
    hideMenu.value = configData.hideMenu;
    sidebarCollapsed.value = configData.sidebarCollapsed;
    zoomLevel.value = configData.zoomLevel;
    cellReferences.value = configData.cellReferences;
    overridableReferences.value = configData.overridableReferences;
    ranges.value = configData.ranges;

    await saveData();

    await promiseTimeout(0);
    initFlowbite();
  } catch (e) {
    ui.notifications.error(
      localize("SHEEXCELREFRESH.Error.FailedLoadingConfig", {
        actor: actor.name,
        error: e.message
      })
    );
  }
});

onMounted(() => {
  data.value = actorSheet.getData();
});

onUnmounted(async () => {
  await saveData();
});
</script>

<style lang="scss">
@plugin "../../altered-plugins/flowbite";
@source "../node_modules/flowbite";

@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
.sheexcel-sheet-container {
  @import "tailwindcss/preflight.css" layer(base);
  @import "tailwindcss/utilities.css" layer(utilities);

  @utility m-* {
    margin: calc(--value(ratio) * 100%);
  }
  @utility mt-* {
    margin-top: calc(--value(ratio) * 100%);
  }
  @utility mb-* {
    margin-bottom: calc(--value(ratio) * 100%);
  }
  @utility ms-* {
    margin-left: calc(--value(ratio) * 100%);
  }
  @utility me-* {
    margin-right: calc(--value(ratio) * 100%);
  }
}
</style>

<style lang="scss" scoped>
.sheexcel-sheet-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 5px 5px;
  position: relative;

  .sheexcel-sheet-header {
    flex: 0 0 auto;
    padding: 0px 504px 0px 0px;
    border-bottom: 1px solid #ddd;
  }

  .sheexcel-sheet-body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .sheexcel-main-content {
    flex: 1;
    overflow: hidden;
  }

  .sheexcel-iframe {
    width: 100%;
    height: 100%;
    border: none;
  }

  .sheexcel-sheet-tabs {
    position: absolute;
    display: flex;
    flex-direction: row;
    top: 5px;
    right: 5px;
    width: 504px;
    height: 35px;
    background: #eeeeee;
    color: #151515;
    border: none;
    a {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 0;
      &:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }
      &.active {
        box-shadow: inset 0 0 5px rgba(255, 165, 0, 0.2),
          inset 0 0 10px rgba(255, 100, 0, 0.3);
        transition: box-shadow 0.3s ease;
      }
    }
  }

  .sheexcel-sidebar {
    position: absolute;
    display: flex;
    flex-direction: column;
    top: 50px;
    right: 5px;
    bottom: 5px;
    width: 504px;
    background-color: #f0f0f0;
    color: #151515;
    padding: 10px 10px;
    box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
    z-index: 100;
    transition: transform 0.3s ease;
    &.collapsed {
      transform: translateX(calc(100% + 20px));
    }
  }

  .sheexcel-sidebar-tab {
    flex-direction: column;
    height: 100%;
  }

  .sheexcel-references-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .sheexcel-ranges-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .sheexcel-settings-container {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 5px 5px;
    margin-bottom: 10px;
    width: 100%;
    justify-self: center;
    align-items: center;
    text-align: center;
    background-color: #ffffff;
  }

  input.sheexcel-settings-container {
    width: 100%;
  }

  .sheexcel-settings-zoom-value {
    min-width: 40px;
    text-align: center;
  }
}
</style>
