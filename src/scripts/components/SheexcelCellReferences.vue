<template>
  <div class="sheexcel-references" ref="referencesEl">
    <div class="sheexcel-cellReference" v-if="!limitToCellReferences">
      <div
        class="sheexcel-reference-cell"
        v-for="(ref, idx) in model"
        ref="referenceEls"
      >
        <input
          class="sheexcel-cell"
          type="text"
          v-model="ref.cell"
          :placeholder="localize('SHEEXCELREFRESH.References.Cell')"
          @input.prevent.stop="onCellReferenceChange(idx, ref)"
        />
        <input
          class="sheexcel-keyword"
          type="text"
          v-model="ref.keyword"
          :placeholder="localize('SHEEXCELREFRESH.References.Keyword')"
          @input.prevent.stop="onKeywordReferenceChange(idx)"
        />
        <span class="sheexcel-reference-remove-value">{{ ref.value }}</span>
        <div v-show="sheetNames.length > 1">
          <select
            class="sheexcel-sheet"
            name="sheet"
            v-model="ref.sheet"
            @change.prevent.stop="onCellReferenceChange(idx, ref)"
          >
            <option
              :value="sheetName"
              v-for="sheetName in sheetNames"
              :selected="sheetName === ref.sheet"
            >
              {{ sheetName }}
            </option>
          </select>
        </div>
        <div v-show="sheetNames.length < 1">
          <span>{{ ref.sheet }}</span>
        </div>
        <div class="sheexcel-reference-remove">
          <button
            type="button"
            class="sheexcel-reference-remove-button"
            @click.stop="onRemoveReference(idx)"
          >
            {{ localize("SHEEXCELREFRESH.Remove") }}
          </button>
        </div>
      </div>
      <div class="sheexcel-references-add" v-if="!limitToCellReferences">
        <button type="button" @click.stop="onAddReference">
          {{ localize("SHEEXCELREFRESH.References.AddReference") }}
        </button>
      </div>
    </div>
    <div class="sheexcel-cellReference" v-if="limitToCellReferences">
      <div
        class="sheexcel-reference-cell"
        v-for="(ref, _idx) in overridableReferences"
        ref="referenceEls"
      >
        <input
          class="sheexcel-cell"
          type="text"
          v-model="ref.cell"
          :placeholder="localize('SHEEXCELREFRESH.References.Cell')"
          @input.prevent.stop="onOverridableCellReferenceChange(ref)"
        />
        <span class="sheexcel-keyword px-2">{{ ref.keyword }}</span>
        <span class="sheexcel-reference-remove-value">{{ ref.value }}</span>
        <div v-show="sheetNames.length > 1">
          <select
            class="sheexcel-sheet"
            name="sheet"
            v-model="ref.sheet"
            @change.prevent.stop="onOverridableCellReferenceChange(ref)"
          >
            <option
              :value="sheetName"
              v-for="sheetName in sheetNames"
              :selected="sheetName === ref.sheet"
            >
              {{ sheetName }}
            </option>
          </select>
        </div>
        <div v-show="sheetNames.length < 1">
          <span>{{ ref.sheet }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, nextTick, ref, useTemplateRef } from "vue";
import { localize } from "../../libs/vue/VueHelpers";

const actorSheet = inject("sheet");

const props = defineProps({
  sheetNames: { type: Array, required: false },
  limitToCellReferences: {
    type: Boolean,
    default: false
  }
});
const model = defineModel();
const system = defineModel("system", { required: false });
const overridableReferences = defineModel("overridableReferences");

const referenceElms = useTemplateRef("referenceEls");
const referencesElm = useTemplateRef("referencesEl");
const cellWidth = ref("60px");
const keywordWidth = ref("110px");

const onRemoveReference = async idx => {
  if (
    window.confirm(
      localize("SHEEXCELREFRESH.AreYouSure", {
        thing: localize("SHEEXCELREFRESH.References.Reference").toLowerCase()
      })
    )
  ) {
    const prevSibling = referenceElms.value[idx].previousElementSibling;
    model.value.splice(idx, 1);
    if (prevSibling !== null) {
      await nextTick();
      prevSibling.scrollIntoView();
    }
    actorSheet._cellReferences = model.value;
  }
};

const onCellReferenceChange = async idx => {
  if (system.value) {
    if (
      typeof actorSheet._cellReferences[idx] !== "undefined" &&
      actorSheet._cellReferences[idx].cell &&
      actorSheet._cellReferences[idx].cell.length &&
      actorSheet._cellReferences[idx].sheet
    ) {
      actorSheet._cellReferences[idx].value = await actorSheet._fetchCellValue(
        actorSheet._sheetId,
        actorSheet._cellReferences[idx].sheet,
        actorSheet._cellReferences[idx].cell
      );
    }
    if (typeof actorSheet._cellReferences[idx] !== "undefined") {
      const ref = system.value;
      ref[actorSheet._cellReferences[idx].keyword] =
        actorSheet._cellReferences[idx].value;
    }
  }
};

const onOverridableCellReferenceChange = async currentRef => {
  if (system.value) {
    if (
      typeof currentRef !== "undefined" &&
      currentRef.cell &&
      currentRef.cell.length &&
      currentRef.sheet
    ) {
      currentRef.value = await actorSheet._fetchCellValue(
        actorSheet._sheetId,
        currentRef.sheet,
        currentRef.cell
      );
    }
    if (typeof currentRef !== "undefined") {
      const ref = system.value;
      ref[currentRef.keyword] = currentRef.value;
    }
  }
};

const onKeywordReferenceChange = index => {
  const ref = system.value;
  ref[actorSheet._cellReferences[index].keyword] =
    actorSheet._cellReferences[index].value;
};

const onAddReference = async () => {
  await actorSheet._fetchSheetNames();
  model.value.push({
    sheet: actorSheet._currentSheetName,
    cell: "",
    keyword: "",
    value: ""
  });
  actorSheet._cellReferences = model.value;
  await nextTick();
  referencesElm.value.scrollTop = referencesElm.value.scrollHeight;
};
</script>

<style lang="scss" scoped>
.sheexcel-references {
  flex-grow: 1;
  overflow-x: hidden;
  overflow-y: auto;

  .sheexcel-reference-cell {
    flex: 1;
    flex-direction: row;
    padding: 5px 5px;
    margin-bottom: 5px;
    width: 100%;
    justify-self: center;
    background-color: #ffffff;
  }
  .sheexcel-cellReference {
    --cellWidth: v-bind("cellWidth");
    --keywordWidth: v-bind("keywordWidth");
    input.sheexcel-cell {
      width: var(--cellWidth);
    }

    input.sheexcel-keyword {
      width: var(--keywordWidth);
    }

    select.sheexcel-sheet {
      max-width: calc(var(--cellWidth) + var(--keywordWidth));
    }

    .sheexcel-references-add {
      flex-shrink: 0;
      margin-top: auto;
    }

    .sheexcel-reference-remove {
      flex-direction: row;
      justify-content: stretch;
      margin-top: 5px;
    }

    .sheexcel-reference-remove-button {
      width: calc(var(--cellWidth) + var(--keywordWidth));
      margin-bottom: 5px;
    }

    .sheexcel-reference-remove-value {
      text-align: center;
      width: 100%;
      margin-left: 10px;
    }
  }
}
</style>
