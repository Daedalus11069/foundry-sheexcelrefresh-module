Hooks.once("init", async function () {

    Actors.registerSheet("sheexcel", SheexcelActorSheet, {
        label: "Sheexcel",
        types: ["character", "npc", "creature", "vehicle"],
        makeDefault: false,
    });

    const originalPrepareData = Actor.prototype.prepareData;
    Actor.prototype.prepareData = function() {
        originalPrepareData.call(this);
        
        this.system.sheexcel = {};
        for (const ref of this.getFlag("sheexcel", "cellReferences") || []) {
            if (ref.keyword && ref.value !== undefined) {
                this.system.sheexcel[ref.keyword] = ref.value;
            }
        }
    };

    game.sheexcel = {
        getSheexcelValue: (actorId, keyword) => {
            const actor = game.actors.get(actorId);
            if (actor && actor.system.sheexcel) {
                return {
                    value: actor.sheet.getSheexcelValue(keyword),
                    actor: actor,
                }
            }
            return null;
        },
        refetchAllCellValues: async () => {
            const actor = game.actors.get(actorId);
            if (actor && actor.system.sheexcel) {
                await actor.sheet._refetchAllCellValues()
                return null;
            }
            return null;
        }
    }
});

class SheexcelActorSheet extends ActorSheet {
    constructor(...args) {
        super(...args);
        this._currentZoomLevel = this.actor.getFlag("sheexcel", "zoomLevel") || 100;
        this._sidebarCollapsed = this.actor.getFlag("sheexcel", "sidebarCollapsed") || false;
        this._cellReferences = this.actor.getFlag("sheexcel", "cellReferences") || [];
        this._sheetId = this.actor.getFlag("sheexcel", "sheetId") || null;
        this._currentSheetName = this.actor.getFlag("sheexcel", "currentSheetName") || null;
        this._sheetNames = this.actor.getFlag("sheexcel", "sheetNames") || [];
        this._iframe = null;
        this._refetchAllCellValues();
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sheet", "actor", "sheexcel"],
            template: "modules/sheexcel/templates/sheet-template.html",
            width: 1200,
            height: 700,
            resizable: true,
            tabs: [
                {
                    navSelector: ".sheexcel-sheet-tabs",
                    contentSelector: ".sheexcel-sidebar",
                    initial: "settings",
                },
            ],
        });
    }

    async getData() {
        const data = super.getData();
        data.sheetUrl = this.actor.getFlag("sheexcel", "sheetUrl") || "";
        data.zoomLevel = this._currentZoomLevel;
        data.hideMenu = this.actor.getFlag("sheexcel", "hideMenu") ?? true;
        data.sidebarCollapsed = this._sidebarCollapsed;
        data.cellReferences = this._cellReferences;
        data.sheetNames = this._sheetNames.length > 1 ? this._sheetNames : null;
        data.currentSheetName = this._currentSheetName;
        data.sheetId = this._sheetId;
        data.adjustedReferences = this._cellReferences.map(cellRef => {
            const sheetNames = this._sheetNames.reduce((acc, name) => {
                acc[name] = name;
                return acc;
            }, {});
            cellRef.sheetNames = sheetNames
            if (cellRef.value.length > 10) {
                cellRef.value = foundry.utils.duplicate(cellRef.value).slice(0, 10);
            }
            return cellRef;
        });
        return data;
    }
    
    async _refetchAllCellValues() {
        if (!this._sheetId || !this._currentSheetName) return;

        for (let i = 0; i < this._cellReferences.length; i++) {
            await this._updateCellValue(i);
        }

        const sheexcelData = {};
        for (const ref of this._cellReferences) {
            if (ref.keyword && ref.value !== undefined) {
                sheexcelData[ref.keyword] = ref.value;
            }
        }
        await this.actor.update({ "system.sheexcel": sheexcelData });
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".sheexcel-sheet-toggle").click(this._onToggleSidebar.bind(this));
        html.find(".sheexcel-sheet-references").click(this._onToggleTab.bind(this));
        html.find(".sheexcel-sheet-settings").click(this._onToggleTab.bind(this));
        html.find(".sheexcel-setting-update-sheet").click(this._onUpdateSheet.bind(this));
        html.find(".sheexcel-reference-add-button").click(this._onAddReference.bind(this));
        html.on("click", ".sheexcel-reference-remove-save", this._onSaveReference.bind(this));
        html.on("click", ".sheexcel-reference-remove-button", this._onRemoveReference.bind(this));
        html.on("change", "#sheexcel-cell", this._onCellReferenceChange.bind(this));
        html.on("change", "#sheexcel-keyword", this._onKeywordReferenceChange.bind(this));
        html.on("change", "#sheexcel-sheet", this._onCellReferenceChange.bind(this));

        this._iframe = html.find(".sheexcel-iframe")[0];
        this._setupZoom(html, this._iframe);
        this._setupHideMenu(html, this._iframe);

        this._applyZoom(this._iframe, this._currentZoomLevel);
    }

    _onToggleSidebar(event) {
        event.preventDefault();
        this._sidebarCollapsed = !this._sidebarCollapsed;

        const icon = $(event.currentTarget.children[0]);

        const collapsed = `<svg width="30" height="24" viewBox="0 -4 27 26" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="25" height="20" fill="#eeeeee" stroke="#000000" stroke-width="2"/>
                    <rect x="18" y="1" width="1" height="20" fill="#151515"/>
                </svg>`;
        const expanded = `<svg width="30" height="24" viewBox="0 -4 27 26" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="25" height="20" fill="#eeeeee" stroke="#000000" stroke-width="2"/>
                    <rect x="18" y="1" width="7" height="20" fill="#151515"/>
                </svg>`;
        icon.empty();
        icon.append(this._sidebarCollapsed ? collapsed : expanded);

        const sidebar = this.element.find(".sheexcel-sidebar");

        sidebar.toggleClass("collapsed", this._sidebarCollapsed);
    }

    _onToggleTab(event) {
        event.preventDefault();
        if (!this._sidebarCollapsed) return;
        this._sidebarCollapsed = false;
        const icon = $(event.currentTarget.parentElement.children[0].children[0]);

        const collapsed = `<svg width="30" height="24" viewBox="0 -4 27 26" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="25" height="20" fill="#eeeeee" stroke="#000000" stroke-width="2"/>
                    <rect x="18" y="1" width="1" height="20" fill="#151515"/>
                </svg>`;
        const expanded = `<svg width="30" height="24" viewBox="0 -4 27 26" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="25" height="20" fill="#eeeeee" stroke="#000000" stroke-width="2"/>
                    <rect x="18" y="1" width="7" height="20" fill="#151515"/>
                </svg>`;
        icon.empty();
        icon.append(this._sidebarCollapsed ? collapsed : expanded);

        const sidebar = this.element.find(".sheexcel-sidebar");

        sidebar.toggleClass("collapsed", this._sidebarCollapsed);
    }

    async _onUpdateSheet(event) {
        event.preventDefault();
        let sheetUrl = this.element.find('input[name="sheetUrl"]').val();

        if (!sheetUrl) {
            this.sheetId = null;
            this.currentSheetName = null;
            this.sheetNames = [];
            this.render(false);
            return;
        }

        const sheetIdMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (sheetIdMatch) {
            this._sheetId = sheetIdMatch[1];
            await this._fetchSheetNames();
        }

        await this.actor.setFlag("sheexcel", "sheetId", this._sheetId);
        await this.actor.setFlag("sheexcel", "sheetName", this._currentSheetName);
        await this.actor.setFlag("sheexcel", "sheetNames", this._sheetNames);
        await this.actor.setFlag("sheexcel", "sheetUrl", sheetUrl);

        this.render(false);
    }

    async _fetchSheetNames() {
        if (!this._sheetId) return;
    
        const url = `https://docs.google.com/spreadsheets/d/${this._sheetId}/edit`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const container = doc.querySelector('.docs-sheet-container-bar');
            
            if (container) {
                this._sheetNames = [];
                const sheetTabs = container.querySelectorAll('.docs-sheet-tab');
                
                sheetTabs.forEach(tab => {
                    const nameElement = tab.children[0].children[0].children[0];
                    if (nameElement) {
                        const sheetName = nameElement.innerHTML.trim();
                        this._sheetNames.push(sheetName);
                    }
                });
                this._currentSheetName = this._sheetNames[0];
            } else {
                console.error("Sheet container not found");
            }
        } catch (error) {
            console.error("Error fetching sheet names:", error);
        }
        return this._sheetNames;
    }

    _onAddReference(event) {
        event.preventDefault();
        this._fetchSheetNames();
        this._cellReferences.push({ sheet: this._currentSheetName, cell: "", keyword: "", value: "" });
        const references = $(event.currentTarget.parentElement.previousElementSibling);
        let sheets;
        if (this._sheetNames.length > 1) {
            sheets = `<select id="sheexcel-sheet" name="sheet">`;
            sheets += this._sheetNames.map((name, i) => `<option value="${i}">${name}</option>`).join("");
            sheets += "</select>";
        } else {
            sheets = `<span class="sheexcel-reference-cell-sheet">${this._currentSheetName}</span>`;
        }
        const refHtml = `<div class="sheexcel-reference-cell">
                    <input id="sheexcel-cell" type="text" value="" placeholder="${game.i18n.localize("SHEEXCEL.Cell")}">
                    <input id="sheexcel-keyword" type="text" value="" placeholder="${game.i18n.localize("SHEEXCEL.Keyword")}">
                    ${sheets}
                    <div class="sheexcel-reference-remove">
                        <button class="sheexcel-reference-remove-button">${game.i18n.localize("SHEEXCEL.Remove")}</button>
                        <span class="sheexcel-reference-remove-value"></span>
                    </div>
                </div>`
        references.append(refHtml);
    }

    _onRemoveReference(event) {
        event.preventDefault();
        const parent = event.currentTarget.parentElement.parentElement;

        const siblings = Array.from(parent.parentElement.children);

        const index = siblings.indexOf(parent);
        this._cellReferences.splice(index, 1);
        parent.remove();
    }

    _onSaveReference(event) {
        event.preventDefault();
        this._refetchAllCellValues();
        this._saveFlags();
    }

    async _fetchCellValue(sheetId, sheetName, cellRef) {
        if (cellRef === "") return "";

        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
            sheetName,
        )}&range=${cellRef}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = (await response.text()).trim().replace(/^"(.*)"$/, "$1");
        return text;
    }

    async _onCellReferenceChange(event) {
        const index = $(event.currentTarget).closest(".sheexcel-reference-cell").index();
        if (event.currentTarget.id === "sheexcel-cell") {
            this._cellReferences[index].cell = event.currentTarget.value;
        } else {
            this._cellReferences[index].sheet = event.target.value;
        }

        if (this._cellReferences[index].cell && this._cellReferences[index].cell.length && this._cellReferences[index].sheet) {
            this._cellReferences[index].value = await this._fetchCellValue(this._sheetId, this._cellReferences[index].sheet, this._cellReferences[index].cell);
            const span = $(event.currentTarget.parentElement.children[3].lastElementChild);
            span.text(this._cellReferences[index].value.slice(0, 10));
        }
        const ref = foundry.utils.duplicate(this.actor.system.sheexcel);
        ref[this._cellReferences[index].keyword] = this._cellReferences[index].value;
        this.actor.update({ "system.sheexcel": ref });
    }

    _onKeywordReferenceChange(event) {
        const index = $(event.currentTarget).closest(".sheexcel-reference-cell").index();
        this._cellReferences[index].keyword = event.currentTarget.value;
        const ref = foundry.utils.duplicate(this.actor.system.sheexcel);
        ref[this._cellReferences[index].keyword] = this._cellReferences[index].value;
        this.actor.update({ "system.sheexcel": ref });
    }

    async _updateCellValue(i) {
        const ref = this._cellReferences[i]
        const value = await this._fetchCellValue(this._sheetId, ref.sheet || this._currentSheetName, ref.cell);
        this._cellReferences[i].value = value;
    }

    _setupZoom(html, iframe) {
        const zoomSlider = html.find("#sheexcel-setting-zoom-slider")[0];
        const zoomValue = html.find("#sheexcel-setting-zoom-value")[0];
        if (zoomSlider && zoomValue) {
            zoomSlider.addEventListener("input", (event) => {
                const zoomLevel = parseInt(event.target.value);
                this._currentZoomLevel = zoomLevel;
                zoomValue.textContent = `${zoomLevel}%`;
                this._applyZoom(iframe, zoomLevel);
            });
        }
    }

    _applyZoom(iframe, zoomLevel) {
        if (iframe) {
            iframe.style.transform = `scale(${zoomLevel / 100})`;
            iframe.style.transformOrigin = "top left";
            iframe.style.width = `${100 * (100 / zoomLevel)}%`;
            iframe.style.height = `${100 * (100 / zoomLevel)}%`;
        }
    }

    _setupHideMenu(html, iframe) {
        const hideMenuCheckbox = html.find("#sheexcel-setting-hide-menu")[0];
        if (hideMenuCheckbox) {
            hideMenuCheckbox.addEventListener("change", async (event) => {
                const hideMenu = event.target.checked;
                await this.actor.setFlag("sheexcel", "hideMenu", hideMenu);
                this._updateIframeSrc(iframe, hideMenu);
            });
        }
    }

    _updateIframeSrc(iframe, hideMenu) {
        if (!iframe) return;

        const sheetUrl = this.actor.getFlag("sheexcel", "sheetUrl");
        if (!sheetUrl) return;

        const rmParam = hideMenu ? "minimal" : "embedded";
        iframe.src = `${sheetUrl}?embedded=true&rm=${rmParam}`;
    }

    async close(...args) {
        await this._saveFlags();
        
        return super.close(...args);
    }

    async _saveFlags() {
        if (!game.user.isGM && !this.actor.isOwner) return;
        const flags = {
            zoomLevel: this._currentZoomLevel,
            sidebarCollapsed: this._sidebarCollapsed,
            cellReferences: this._cellReferences,
            currentSheetName: this._currentSheetName,
            sheetNames: this._sheetNames
        };
        await this.actor.update({
            'flags.sheexcel': flags
        });
    }

    getSheexcelValue(keyword) {
        return this.actor.system.sheexcel[keyword] || null;
    }
}
