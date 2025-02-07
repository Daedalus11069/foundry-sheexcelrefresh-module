<template>
  <div class="overflow-y-auto p-[0.1rem]">
    <div :id="accordionId" data-accordion="collapse">
      <VueDraggable
        class="w-full"
        :animation="150"
        handle=".range-sort-handle"
        v-model="ranges"
      >
        <div v-for="(range, rangeIdx) in ranges" :key="range.id" class="mb-1">
          <h2 :id="`${range.id}-collapse-heading`" class="flex flex-row">
            <div class="range-sort-handle basis-[30px] icon p-2">
              <div class="fa fa-sort"></div>
            </div>
            <button
              type="button"
              class="flex flex-row items-center justify-between w-full p-1 px-4 font-medium rtl:text-right text-gray-500 border border-b-0 border-gray-200 rounded-t-xl focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 gap-3"
              :data-accordion-target="`#${range.id}-collapse-body`"
              aria-expanded="true"
            >
              <span>{{ range.name || "&lt;insert name&gt;" }}</span>
              <svg
                data-accordion-icon
                class="w-3 h-3 rotate-180 shrink-0"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 10 6"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5 5 1 1 5"
                />
              </svg>
            </button>
          </h2>
          <div :id="`${range.id}-collapse-body`" class="hidden">
            <div class="flex flex-row">
              <div class="basis-8/12 flex flex-row">
                <label class="mr-3 basis-4/12">
                  {{ localize("SHEEXCELREFRESH.Ranges.Name") }}:
                </label>
                <div class="basis-8/12">
                  <input
                    type="text"
                    class="sheet-input"
                    v-maska="'a'"
                    data-maska-tokens="a:[a-zA-Z0-9]:repeated"
                    v-model="range.name"
                  />
                </div>
              </div>
              <div class="basis-4/12 ms-8 pe-[0.1rem]">
                <button type="button" @click="onRemoveRange(rangeIdx)">
                  {{ localize("SHEEXCELREFRESH.Remove") }}
                  {{ localize("SHEEXCELREFRESH.Ranges.Range") }}
                </button>
              </div>
            </div>
            <div class="flex flex-row">
              <div class="basis-8/12 flex flex-row">
                <div class="range-sort-handle basis-2/12 icon"></div>
                <label class="mr-3 basis-4/12">
                  {{ localize("SHEEXCELREFRESH.Ranges.CellRange") }}:
                </label>
                <div class="basis-8/12">
                  <input
                    type="text"
                    class="sheet-input"
                    v-model="range.cellRange"
                  />
                </div>
              </div>
              <div class="basis-4/12 ms-8"></div>
            </div>
            <div class="flex flex-row">
              <div class="basis-8/12 flex flex-row">
                <div class="basis-2/12"></div>
                <label class="mr-3 basis-4/12">
                  {{ localize("SHEEXCELREFRESH.Ranges.Sheet") }}:
                </label>
                <div class="basis-8/12">
                  <select class="sheet-input" v-model="range.sheet">
                    <option :value="sheet" v-for="sheet in sheetNames">
                      {{ sheet }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="basis-4/12 ms-8 pe-[0.1rem]">
                <button type="button" @click="onDuplicateRange(rangeIdx)">
                  {{ localize("SHEEXCELREFRESH.Ranges.Duplicate") }}
                  {{ localize("SHEEXCELREFRESH.Ranges.Range") }}
                </button>
              </div>
            </div>
            <div>
              <label>{{ localize("SHEEXCELREFRESH.Ranges.Headers") }}</label>
              <div class="relative">
                <div
                  class="flex flex-row sticky -top-1 sticky-header"
                  v-show="range.headers.length > 0"
                >
                  <div class="basis-3/12">
                    {{ localize("SHEEXCELREFRESH.Ranges.HeaderName") }}:
                  </div>
                  <div class="basis-3/12">
                    {{ localize("SHEEXCELREFRESH.Ranges.HeaderIndex") }}:
                  </div>
                  <div class="basis-3/12">
                    {{ localize("SHEEXCELREFRESH.Ranges.HeaderType") }}:
                  </div>
                </div>

                <div
                  v-for="(header, headerIdx) in range.headers"
                  :key="header.id"
                  class="mb-1"
                >
                  <div class="flex flex-row">
                    <div class="basis-3/12">
                      <input
                        type="text"
                        class="sheet-input"
                        :placeholder="
                          localize('SHEEXCELREFRESH.Ranges.HeaderName')
                        "
                        v-maska="'a'"
                        data-maska-tokens="a:[a-zA-Z0-9]:repeated"
                        v-model="header.name"
                      />
                    </div>
                    <div class="basis-3/12">
                      <input
                        type="number"
                        class="sheet-input"
                        :min="0"
                        :placeholder="
                          localize('SHEEXCELREFRESH.Ranges.HeaderIndex')
                        "
                        v-model.number="header.index"
                        @blur="onSortHeadersByIndex(range)"
                      />
                    </div>
                    <div class="basis-3/12">
                      <select
                        v-model="header.type"
                        @change="onDisableTextOptions(header)"
                      >
                        <option value="text">
                          {{
                            localize("SHEEXCELREFRESH.Ranges.HeaderTypes.text")
                          }}
                        </option>
                        <option value="number">
                          {{
                            localize(
                              "SHEEXCELREFRESH.Ranges.HeaderTypes.number"
                            )
                          }}
                        </option>
                      </select>
                    </div>
                    <div class="basis-3/12">
                      <div class="ms-2 pe-[0.1rem]">
                        <button
                          type="button"
                          @click="onRemoveHeader(range, headerIdx)"
                        >
                          {{ localize("SHEEXCELREFRESH.Remove") }}
                          {{ localize("SHEEXCELREFRESH.Ranges.Header") }}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="flex flex-row">
                    <div class="basis-3/12">
                      <label>
                        {{ localize("SHEEXCELREFRESH.Ranges.HeaderDefault") }}:
                      </label>
                      <input
                        type="text"
                        class="sheet-input"
                        v-model="header.default"
                        :placeholder="
                          localize(
                            'SHEEXCELREFRESH.Ranges.HeaderPlaceholderDefault'
                          )
                        "
                      />
                    </div>
                    <div class="basis-9/12">
                      <label>
                        {{ localize("SHEEXCELREFRESH.Ranges.HeaderOptions") }}:
                      </label>
                      <div class="flex items-center mb-4">
                        <label
                          class="ms-2 text-sm font-medium inert:opacity-50"
                          :for="`${header.id}-checkbox-lc`"
                          :inert="header.type !== 'text'"
                        >
                          <input
                            :id="`${header.id}-checkbox-lc`"
                            class="w-5! h-5! text-blue-600 bg-gray-100 border-gray-300 rounded-sm ring-1 ring-gray-500 hover:ring-gray-600"
                            :class="{
                              'focus:ring-blue-500 dark:focus:ring-blue-600':
                                header.type === 'text'
                            }"
                            type="checkbox"
                            :disabled="header.type !== 'text'"
                            v-model="header.options.lowerCase"
                          />
                          {{
                            localize(
                              "SHEEXCELREFRESH.Ranges.HeaderOption.LowerCase"
                            )
                          }}
                        </label>
                        <label
                          class="ms-2 text-sm font-medium inert:opacity-50"
                          :for="`${header.id}-checkbox-id`"
                          :inert="header.type !== 'text'"
                          :title="
                            localize(
                              'SHEEXCELREFRESH.Ranges.HeaderOption.IdentifierHelp'
                            )
                          "
                        >
                          <input
                            :id="`${header.id}-checkbox-id`"
                            class="w-5! h-5! text-blue-600 bg-gray-100 border-gray-300 rounded-sm ring-1 ring-gray-500 hover:ring-gray-600"
                            :class="{
                              'focus:ring-blue-500 dark:focus:ring-blue-600':
                                header.type === 'text'
                            }"
                            type="checkbox"
                            :title="
                              localize(
                                'SHEEXCELREFRESH.Ranges.HeaderOption.IdentifierHelp'
                              )
                            "
                            :disabled="header.type !== 'text'"
                            v-model="header.options.identifier"
                          />
                          {{
                            localize(
                              "SHEEXCELREFRESH.Ranges.HeaderOption.Identifier"
                            )
                          }}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <button type="button" @click="onAddHeader(range)">
                  {{ localize("SHEEXCELREFRESH.Ranges.AddHeader") }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </VueDraggable>
      <div>
        <button type="button" @click="onAddRange">
          {{ localize("SHEEXCELREFRESH.Ranges.AddRange") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, onMounted, onUnmounted } from "vue";
import { promiseTimeout } from "@vueuse/core";
import { VueDraggable } from "vue-draggable-plus";
import { cloneDeep } from "lodash-es";
import { vMaska } from "maska/vue";
import { initFlowbite } from "flowbite";
import { nanoid } from "../../libs/nanoid";
import { localize } from "../../libs/vue/VueHelpers";

const actorSheet = inject("actorSheet");

const props = defineProps({
  sheetNames: Array
});
const ranges = defineModel();
const accordionId = nanoid();

const onAddRange = async () => {
  ranges.value.push({
    id: nanoid(),
    name: "",
    cellRange: "",
    sheet: props.sheetNames[0],
    headers: []
  });
  await promiseTimeout(0);
  initFlowbite();
};

const onDuplicateRange = async idx => {
  if (
    window.confirm(
      localize("SHEEXCELREFRESH.DoYouWantTo", {
        action: localize("SHEEXCELREFRESH.Ranges.Duplicate").toLowerCase(),
        thing: localize("SHEEXCELREFRESH.Ranges.Range").toLowerCase()
      })
    )
  ) {
    const range = cloneDeep(ranges.value[idx]);
    range.id = nanoid();
    range.name += idx + 1;
    ranges.value.push(range);
    await promiseTimeout(0);
    initFlowbite();
  }
};

const onRemoveRange = idx => {
  if (
    window.confirm(
      localize("SHEEXCELREFRESH.AreYouSure", {
        thing: localize("SHEEXCELREFRESH.Ranges.Range").toLowerCase()
      })
    )
  ) {
    ranges.value.splice(idx, 1);
  }
};

const onAddHeader = range => {
  range.headers.push({
    id: nanoid(),
    name: "",
    index: 0,
    type: "text",
    default: "",
    options: {
      lowerCase: false,
      identifier: false
    }
  });
};

const onDisableTextOptions = header => {
  header.options.lowerCase = false;
  header.options.identifier = false;
};

const onSortHeadersByIndex = range => {
  range.headers.sort(({ index: a }, { index: b }) => a - b);
};

const onRemoveHeader = (range, idx) => {
  if (
    window.confirm(
      localize("SHEEXCELREFRESH.AreYouSure", {
        thing: localize("SHEEXCELREFRESH.Ranges.Header").toLowerCase()
      })
    )
  ) {
    range.headers.splice(idx, 1);
  }
};

onMounted(async () => {
  await promiseTimeout(0);
  initFlowbite();
});

onUnmounted(async () => {
  actorSheet._ranges = ranges.value;
});
</script>

<style lang="scss" scoped>
.icon {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-top: -0.2rem;
  height: 100%;
}
.sheet-input {
  width: 100%;
}
.sticky-header {
  background-color: #f0f0f0;
}
select,
[type="number"] {
  border: 1px solid rgba(0, 0, 0, 0.2) !important;
  height: 24px;
}
</style>
