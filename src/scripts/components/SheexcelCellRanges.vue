<template>
  <VueDraggable :animation="150" handle=".range-sort-handle" v-model="ranges">
    <div v-for="(range, rangeIdx) in ranges" :key="range.id" class="mb-1">
      <div class="flex flex-row">
        <div class="basis-8/12 flex flex-row">
          <div class="range-sort-handle basis-2/12 icon">
            <div class="fa fa-sort"></div>
          </div>
          <label class="mr-3 basis-4/12">
            {{ localize("SHEEXCELREFRESH.Ranges.Name") }}:
          </label>
          <div class="basis-8/12">
            <input type="text" class="sheet-input" v-model="range.name" />
          </div>
        </div>
        <div class="basis-4/12 ms-8">
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
            <input type="text" class="sheet-input" v-model="range.cellRange" />
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
        <div class="basis-4/12 ms-8"></div>
      </div>
      <div>
        <label>{{ localize("SHEEXCELREFRESH.Ranges.Headers") }}</label>
        <div>
          <div class="flex flex-row" v-show="range.headers.length > 0">
            <div class="basis-[30px]"></div>
            <div class="basis-3/12">
              {{ localize("SHEEXCELREFRESH.Ranges.HeaderName") }}:
            </div>
            <div class="basis-3/12">
              {{ localize("SHEEXCELREFRESH.Ranges.HeaderIndex") }}:
            </div>
            <div class="basis-3/12">
              {{ localize("SHEEXCELREFRESH.Ranges.HeaderType") }}:
            </div>
            <div class="basis-3/12"></div>
          </div>

          <VueDraggable
            :animation="150"
            handle=".header-sort-handle"
            v-model="range.headers"
          >
            <div
              v-for="(header, headerIdx) in range.headers"
              :key="header.id"
              class="mb-1"
            >
              <div class="flex flex-row">
                <div class="basis-[30px]">
                  <div class="header-sort-handle icon">
                    <div class="fa fa-sort"></div>
                  </div>
                </div>
                <div class="basis-3/12">
                  <input
                    type="text"
                    v-model="header.name"
                    :placeholder="localize('SHEEXCELREFRESH.Ranges.HeaderName')"
                  />
                </div>
                <div class="basis-3/12">
                  <input
                    type="number"
                    :min="0"
                    v-model.number="header.index"
                    :placeholder="
                      localize('SHEEXCELREFRESH.Ranges.HeaderIndex')
                    "
                  />
                </div>
                <div class="basis-3/12">
                  <select v-model="header.type">
                    <option value="text">
                      {{ localize("SHEEXCELREFRESH.Ranges.HeaderTypes.text") }}
                    </option>
                    <option value="number">
                      {{
                        localize("SHEEXCELREFRESH.Ranges.HeaderTypes.number")
                      }}
                    </option>
                    <option value="key">
                      {{ localize("SHEEXCELREFRESH.Ranges.HeaderTypes.key") }}
                    </option>
                  </select>
                </div>
                <div class="basis-3/12">
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
          </VueDraggable>
        </div>
        <div>
          <button type="button" @click="onAddHeader(range)">
            {{ localize("SHEEXCELREFRESH.Ranges.AddHeader") }}
          </button>
        </div>
      </div>
    </div>
    <div>
      <button type="button" @click="onAddRange">
        {{ localize("SHEEXCELREFRESH.Ranges.AddRange") }}
      </button>
    </div>
  </VueDraggable>
</template>

<script setup>
import { inject, onUnmounted } from "vue";
import { VueDraggable } from "vue-draggable-plus";
import { nanoid } from "nanoid";
import { localize } from "../../libs/vue/VueHelpers";

const actorSheet = inject("actorSheet");

const props = defineProps({
  sheetNames: Array
});
const ranges = defineModel();

const onAddRange = () => {
  ranges.value.push({
    id: nanoid(),
    name: "",
    cellRange: "",
    sheet: props.sheetNames[0],
    headers: []
  });
};

const onRemoveRange = idx => {
  if (
    window.confirm(
      localize("SHEEXCELREFRESH.Ranges.AreYouSure", {
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
    type: "text"
  });
};

const onRemoveHeader = (range, idx) => {
  if (
    window.confirm(
      localize("SHEEXCELREFRESH.Ranges.AreYouSure", {
        thing: localize("SHEEXCELREFRESH.Ranges.Header").toLowerCase()
      })
    )
  ) {
    range.headers.splice(idx, 1);
  }
};

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
select,
[type="number"] {
  border: 1px solid rgba(0, 0, 0, 0.2) !important;
  height: 24px;
}
</style>
