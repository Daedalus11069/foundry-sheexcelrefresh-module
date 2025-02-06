<template>
  <div class="sheexcel-references" ref="referencesEl">
    <div class="sheexcel-cellReference">
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
      <div class="sheexcel-references-add">
        <button type="button" @click.stop="onAddReference">
          {{ localize("SHEEXCELREFRESH.References.AddReference") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, nextTick, ref, useTemplateRef } from "vue";
import { localize } from "../../libs/vue/VueHelpers";

const actorSheet = inject("actorSheet");

const props = defineProps({
  sheetNames: Array
});
const model = defineModel();
const system = defineModel("system");

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

const onCellReferenceChange = async (index, currentRef) => {
  if (
    actorSheet._cellReferences[index].cell &&
    actorSheet._cellReferences[index].cell.length &&
    actorSheet._cellReferences[index].sheet
  ) {
    actorSheet._cellReferences[index].value = await actorSheet._fetchCellValue(
      actorSheet._sheetId,
      actorSheet._cellReferences[index].sheet,
      actorSheet._cellReferences[index].cell
    );
  }
  const ref = system.value;
  ref[actorSheet._cellReferences[index].keyword] =
    actorSheet._cellReferences[index].value;
  currentRef.value = actorSheet._cellReferences[index].value;
};

const onKeywordReferenceChange = index => {
  const ref = system.value;
  ref[actorSheet._cellReferences[index].keyword] =
    actorSheet._cellReferences[index].value;
};

const onAddReference = async () => {
  actorSheet._fetchSheetNames();
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
