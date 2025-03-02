<template>
  <div class="sheexcel-sheet-container">
    <header class="sheexcel-sheet-header">
      <h1>
        {{ localize("SHEEXCELREFRESH.OverridableReferencesMenu.Label") }}
      </h1>
    </header>
    <div>
      <ComboboxRoot
        v-model="overridableReferences"
        v-model:search-term="searchTerm"
        multiple
        class="my-4 mx-auto relative"
      >
        <ComboboxAnchor
          class="w-[400px] inline-flex items-center justify-between rounded-lg p-2 text-[13px] leading-none gap-[5px] bg-white text-gray-2001 shadow-[0_2px_10px] shadow-black/10 hover:bg-gray-100 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-gray-500 outline-none"
        >
          <TagsInputRoot
            v-slot="{ modelValue: tags }"
            v-model="overridableReferences"
            delimiter=""
            class="flex gap-2 items-center rounded-lg flex-wrap"
          >
            <TagsInputItem
              v-for="item in tags"
              :key="item"
              :value="item"
              class="flex items-center justify-center gap-2 text-white bg-gray-400 aria-[current=true]:bg-gray-500 rounded px-2 py-1"
            >
              <TagsInputItemText class="text-sm" />
              <TagsInputItemDelete class="bg-none!">
                <i class="fas fa-times" />
              </TagsInputItemDelete>
            </TagsInputItem>

            <ComboboxInput as-child>
              <TagsInputInput
                placeholder="Keys..."
                class="focus:outline-none flex-1 rounded !bg-transparent placeholder:text-gray-600 px-1 border-none! focus:[box-shadow:none]!"
                @keydown.enter.prevent
              />
            </ComboboxInput>
          </TagsInputRoot>

          <ComboboxTrigger class="bg-none! w-auto!">
            <i class="h-4 w-4 text-gray-600 fas fa-chevron-down" />
          </ComboboxTrigger>
        </ComboboxAnchor>
        <ComboboxContent
          class="absolute w-[400px] z-10 mt-2 bg-white overflow-hidden rounded shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade"
        >
          <ComboboxViewport class="p-[5px]">
            <ComboboxEmpty
              class="text-gray-400 text-xs font-medium text-center py-2"
            />

            <ComboboxGroup>
              <ComboboxLabel
                class="px-[25px] text-xs leading-[25px] text-black"
              >
                Keys
              </ComboboxLabel>

              <ComboboxItem
                v-for="(option, index) in availableKeys"
                :key="index"
                class="text-[13px] leading-none text-gray-600 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-black data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-gray-200 data-[highlighted]:text-gray-600"
                :value="option"
              >
                <ComboboxItemIndicator
                  class="absolute left-0 w-[25px] inline-flex items-center justify-center"
                >
                  <i class="fas fa-check" />
                </ComboboxItemIndicator>
                <span>
                  {{ option }}
                </span>
              </ComboboxItem>
            </ComboboxGroup>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxRoot>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, onUnmounted, ref } from "vue";
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxLabel,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
  TagsInputRoot
} from "radix-vue";
import { localize } from "../libs/vue/VueHelpers";
import { deepUnref } from "../libs/utils";
import { initFlowbite } from "flowbite";

const settingsSheet = inject("sheet");

const data = ref(settingsSheet.getData());
const availableKeys = ref(
  data.value.availableKeys.map(({ keyword }) => keyword)
);
const overridableReferences = ref(data.value.referenceKeys);
const searchTerm = ref("");

const saveData = async () => {
  const config = deepUnref({
    referenceKeys: overridableReferences
  });
  settingsSheet._updateObject(config);
};

onMounted(() => {
  data.value = settingsSheet.getData();
  initFlowbite();
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

<style lang="scss" scoped></style>
