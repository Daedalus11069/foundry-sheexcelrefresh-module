import { inferSchema, initParser } from "udsv";
import parse from "csv-simple-parser";
import { dollar as phrase } from "paraphrase";
import { stringToIdentifier } from "./libs/utils";
import SheexcelActorSheet from "./SheexcelActorSheet";
import SheexcelGlobalConfigForm from "./SheexcelGlobalConfigForm";
import SheexcelOverridableReferencesForm from "./SheexcelOverridableReferencesForm";

Hooks.once("init", async function () {
  game.settings.registerMenu("sheexcelrefresh", "GlobalConfigMenu", {
    name: "SHEEXCELREFRESH.GlobalSettingsMenu.Name",
    label: "SHEEXCELREFRESH.GlobalSettingsMenu.Label",
    icon: "fas fa-list",
    type: SheexcelGlobalConfigForm,
    restricted: true
  });

  game.settings.registerMenu("sheexcelrefresh", "OverridableReferencesMenu", {
    name: "SHEEXCELREFRESH.OverridableReferencesMenu.Name",
    label: "SHEEXCELREFRESH.OverridableReferencesMenu.Label",
    icon: "fas fa-list",
    type: SheexcelOverridableReferencesForm,
    restricted: true
  });

  game.settings.register("sheexcelrefresh", "individualConfigAllowed", {
    scope: "world",
    config: true,
    name: "SHEEXCELREFRESH.IndividualConfig.AllowedName",
    hint: "SHEEXCELREFRESH.IndividualConfig.AllowedHint",
    type: Boolean,
    default: false
  });

  game.settings.register("sheexcelrefresh", "individualOverrideAllowed", {
    scope: "world",
    config: true,
    name: "SHEEXCELREFRESH.IndividualOverride.AllowedName",
    hint: "SHEEXCELREFRESH.IndividualOverride.AllowedHint",
    type: Boolean,
    default: false
  });

  game.settings.register("sheexcelrefresh", "overridableReferenceKeys", {
    scope: "world", // "world" = sync to db, "client" = local storage
    config: false, // we will use the menu above to edit this setting
    name: "SHEEXCELREFRESH.OverridableReferenceKeys.AllowedName",
    hint: "SHEEXCELREFRESH.OverridableReferenceKeys.AllowedHint",
    type: Array,
    default: [] // can be used to set up the default structure
  });

  game.settings.register("sheexcelrefresh", "globalConfig", {
    scope: "world", // "world" = sync to db, "client" = local storage
    config: false, // we will use the menu above to edit this setting
    type: Object,
    default: {
      activeTab: "settings",
      sheetId: "",
      sheetUrl: "",
      sheetNames: [],
      currentSheetName: "",
      hideMenu: true,
      sidebarCollapsed: false,
      zoomLevel: 100,
      cellReferences: [],
      ranges: []
    } // can be used to set up the default structure
  });

  Actors.registerSheet("sheexcelrefresh", SheexcelActorSheet, {
    label: "SHEEXCELREFRESH.SheetLabel",
    types: ["character", "npc", "creature", "vehicle"],
    makeDefault: false
  });

  Actor.prototype._getSheexcelConfig = function (keys) {
    const localConfigAllowed =
      game.settings.get("sheexcelrefresh", "individualConfigAllowed") || false;

    const globalConfig =
      game.settings.get("sheexcelrefresh", "globalConfig") || {};

    let returnData = Object.keys(keys).reduce((carry, key) => {
      const keyDefault = keys[key];
      if (typeof globalConfig[key] !== "undefined") {
        carry[key] = globalConfig[key];
      } else {
        carry[key] = keyDefault;
      }
      return carry;
    }, {});

    if (localConfigAllowed) {
      returnData = Object.keys(keys).reduce((carry, key) => {
        const keyData = this.getFlag("sheexcelrefresh", key);
        if (typeof keyData !== "undefined") {
          carry[key] = keyData;
        }
        return carry;
      }, returnData);
    }

    return returnData;
  };

  const originalPrepareData = Actor.prototype.prepareData;
  Actor.prototype.prepareData = function () {
    originalPrepareData.call(this);

    this.system.sheexcelrefresh = {};
    const { cellReferences } = this._getSheexcelConfig({
      cellReferences: []
    });
    const individualOverrideAllowed =
      game.settings.get("sheexcelrefresh", "individualOverrideAllowed") ||
      false;
    const allowOverride =
      this.getFlag("sheexcelrefresh", "allowOverride") || false;
    const overrideKeys =
      game.settings.get("sheexcelrefresh", "overridableReferenceKeys") || [];
    const overrides =
      this.getFlag("sheexcelrefresh", "overridableCellReferences") || [];

    if (individualOverrideAllowed || allowOverride) {
      for (const overrideKey of overrideKeys) {
        const override = overrides.find(ov => ov.keyword === overrideKey);
        const refIdx = cellReferences.findIndex(
          cr => cr.keyword === overrideKey
        );
        if (typeof override !== "undefined" && refIdx >= 0) {
          cellReferences[refIdx].cell = override.cell;
          cellReferences[refIdx].sheet = override.sheet;
          cellReferences[refIdx].value = override.value;
        }
      }
    }
    for (const ref of cellReferences) {
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

  Actor.prototype.refreshCellValues = async function (cellKeywords = []) {
    if (this.system.sheexcelrefresh) {
      const individualOverrideAllowed =
        game.settings.get("sheexcelrefresh", "individualOverrideAllowed") ||
        false;

      const allowOverride =
        this.getFlag("sheexcelrefresh", "allowOverride") || false;

      const overrideKeys =
        game.settings.get("sheexcelrefresh", "overridableReferenceKeys") || [];
      const overrides =
        this.getFlag("sheexcelrefresh", "overridableCellReferences") || [];

      const sheexcelData = {};
      const cells = {};
      const updatedReferences = [];
      let { cellReferences } = this._getSheexcelConfig({
        cellReferences: []
      });

      if (individualOverrideAllowed || allowOverride) {
        for (const overrideKey of overrideKeys) {
          const override = overrides.find(ov => ov.keyword === overrideKey);
          const refIdx = cellReferences.findIndex(
            cr => cr.keyword === overrideKey
          );
          if (typeof override !== "undefined" && refIdx >= 0) {
            cellReferences[refIdx].cell = override.cell;
            cellReferences[refIdx].sheet = override.sheet;
            cellReferences[refIdx].value = override.value;
          }
        }
      }
      cellReferences = cellReferences.filter(cellReference => {
        if (cellKeywords.length > 0) {
          return cellKeywords.includes(cellReference.keyword);
        }
        return true;
      });

      for await (const ref of cellReferences) {
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

  Actor.prototype.refreshRangeValues = async function (rangeNames = []) {
    if (this.system.sheexcelrefresh) {
      const sheexcelData = {};
      let { ranges } = this._getSheexcelConfig({ ranges: [] });
      ranges = ranges.filter(range => {
        if (rangeNames.length > 0) {
          return (
            rangeNames.findIndex(
              rangeName => rangeName.toLowerCase() === range.name.toLowerCase()
            ) >= 0
          );
        }
        return true;
      });
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

  Actor.prototype.refreshSheexcelData = async function (
    { cellKeywords, rangeNames } = { cellKeywords: [], rangeNames: [] }
  ) {
    await this.refreshCellValues(cellKeywords);
    await this.refreshRangeValues(rangeNames);
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
    refreshSheexcelData: async (
      actorId,
      { cellKeywords = [], rangeNames = [] }
    ) => {
      const actor = game.actors.get(actorId);
      if (actor && actor.system.sheexcelrefresh) {
        await actor.refreshSheexcelData({ cellKeywords, rangeNames });
      }
    },
    refreshAllCellValues: async (actorId, cellKeywords = []) => {
      const actor = game.actors.get(actorId);
      if (actor && actor.system.sheexcelrefresh) {
        await actor.refreshCellValues(cellKeywords);
      }
    },
    refreshAllRangeValues: async (actorId, rangeNames = []) => {
      const actor = game.actors.get(actorId);
      if (actor && actor.system.sheexcelrefresh) {
        await actor.refreshRangeValues(rangeNames);
      }
    }
  };
});
