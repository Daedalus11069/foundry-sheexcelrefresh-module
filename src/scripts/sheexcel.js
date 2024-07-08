Hooks.once("init", async function () {
    console.log("Sheexcel | Initializing Sheexcel Module");

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
        }
    }

});

Hooks.once("ready", async function () {
    console.log("Sheexcel | Ready");
});

class SheexcelActorSheet extends ActorSheet {
    constructor(...args) {
        super(...args);
        this._currentZoomLevel = this.actor.getFlag("sheexcel", "zoomLevel") || 100;
        this._sidebarCollapsed = this.actor.getFlag("sheexcel", "sidebarCollapsed") || false;
        this._cellReferences = this.actor.getFlag("sheexcel", "cellReferences") || [];
        this._sheetId = this.actor.getFlag("sheexcel", "sheetId") || null;
        this._currentSheetName = this.actor.getFlag("sheexcel", "currentSheetName") || null;
        this._sheetNames = [];
        this._refetchAllCellValues();
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sheet", "actor", "sheexcel"],
            template: "modules/sheexcel/templates/sheet-template.html",
            width: 1200,
            height: 700,
            resizable: true,
        });
    }

    async getData() {
        const data = super.getData();
        data.sheetUrl = this.actor.getFlag("sheexcel", "sheetUrl") || "";
        data.zoomLevel = this._currentZoomLevel;
        data.hideMenu = this.actor.getFlag("sheexcel", "hideMenu") ?? true;
        data.sidebarCollapsed = this._sidebarCollapsed;
        data.cellReferences = this._cellReferences;

        return data;
    }
    
    async _refetchAllCellValues() {
        if (!this._sheetId || !this._currentSheetName) {
            console.error("Sheet ID or name not found. Make sure the Google Sheet URL is correct and a sheet is selected.");
            return;
        }

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

        html.find(".sheexcel-update-sheet").click(this._onUpdateSheet.bind(this));
        html.find(".sheexcel-sidebar-toggle").click(this._onToggleSidebar.bind(this));
        html.find(".sheexcel-add-reference").click(this._onAddCellReference.bind(this));
        html.find(".sheexcel-remove-reference").click(this._onRemoveCellReference.bind(this));
        html.find(".sheexcel-cell, .sheexcel-keyword").change(this._onCellReferenceChange.bind(this));
        html.find(".sheexcel-sheet-select").change(this._onSheetSelect.bind(this));

        const iframe = html.find(".sheexcel-iframe")[0];
        this._setupZoom(html, iframe);
        this._setupHideMenu(html, iframe);

        this._applyZoom(iframe, this._currentZoomLevel);
    }

    async _onToggleSidebar(event) {
        event.preventDefault();
        this._sidebarCollapsed = !this._sidebarCollapsed;

        const toggleButton = $(event.currentTarget);
        toggleButton.text(
            (this._sidebarCollapsed ? "◀ " : "▶ ") +
                game.i18n.localize("SHEEXCEL.Sidebar"),
        );

        const sidebar = this.element.find(".sheexcel-sidebar");

        sidebar.toggleClass("collapsed", this._sidebarCollapsed);
    }

    async _onCellReferenceChange(event) {
        const index = $(event.currentTarget).closest(".sheexcel-cell-reference").index();
        const field = event.currentTarget.classList.contains("sheexcel-cell") ? "cell" : "keyword";

        const oldKeyword = this._cellReferences[index].keyword;
        this._cellReferences[index][field] = event.currentTarget.value;

        if (field === "keyword" && oldKeyword !== this._cellReferences[index].keyword) {
            await this._removeSheexcelData(oldKeyword);
        }
        
        await this._updateCellValue(index);
        
    }

    async _updateCellValue(index) {
        if (!this._sheetId || !this._currentSheetName) {
            console.error("Sheet ID or name not found. Make sure the Google Sheet URL is correct and a sheet is selected.");
            return;
        }

        const cellRef = this._cellReferences[index];
        if (!cellRef.cell) return;

        try {
            const value = await this._fetchCellValue(this._sheetId, this._currentSheetName, cellRef.cell);
            cellRef.value = value;

        } catch (error) {
            console.error("Error fetching cell value:", error);
        }
    }

    async _fetchCellValue(sheetId, sheetName, cellRef) {

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

    async _onAddCellReference(event) {
        event.preventDefault();
        this._cellReferences.push({ cell: "", keyword: "", value: "" });
        this._renderSidebar();
    }

    async _onRemoveCellReference(event) {
        event.preventDefault();
        const index = $(event.currentTarget).closest(".sheexcel-cell-reference").index();
        const removedRef = this._cellReferences.splice(index, 1)[0];
        await this._removeSheexcelData(removedRef.keyword);
        this._renderSidebar();
    }

    async _removeSheexcelData(keyword) {
        if (keyword) {
            const sheexcelData = duplicate(this.actor.system.sheexcel);
            delete sheexcelData[keyword];
        }
    }

    async _renderSidebar() {
        const sidebarContainer = this.element.find(".sheexcel-sidebar-content");
        sidebarContainer.empty();

        this._cellReferences.forEach((ref, index) => {
            const cellRefHtml = `
                <div class="sheexcel-cell-reference">
                    <input type="text" class="sheexcel-cell" value="${ref.cell}" placeholder="${game.i18n.localize("SHEEXCEL.Cell")}">
                    <input type="text" class="sheexcel-keyword" value="${ref.keyword}" placeholder="${game.i18n.localize("SHEEXCEL.Keyword")}">
                    <span class="sheexcel-value">${ref.value || ""}</span>
                    <button class="sheexcel-remove-reference"><i class="fas fa-trash"></i></button>
                </div>
            `;
            sidebarContainer.append(cellRefHtml);
        });

        sidebarContainer.append(`<button class="sheexcel-add-reference">${game.i18n.localize("SHEEXCEL.AddReference")}</button>`);

        this._activateSidebarListeners(sidebarContainer);

        this.render(false)
    }

    _activateSidebarListeners(container) {
        container.find(".sheexcel-add-reference").click(this._onAddCellReference.bind(this));
        container.find(".sheexcel-remove-reference").click(this._onRemoveCellReference.bind(this));
        container.find(".sheexcel-cell, .sheexcel-keyword").change(this._onCellReferenceChange.bind(this));
    }

    async _onUpdateSheet(event) {
        event.preventDefault();
        let sheetUrl = this.element.find('input[name="sheetUrl"]').val();
        console.log(sheetUrl);

        if (sheetUrl && !sheetUrl.endsWith("/edit")) {
            sheetUrl += "/edit";
        }

        const sheetIdMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (sheetIdMatch) {
            this._sheetId = sheetIdMatch[1];
            await this._fetchSheetNames();
        }

        await this.actor.setFlag("sheexcel", "sheetId", this._sheetId);
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
                        
                        if (tab.classList.contains('docs-sheet-active-tab')) {
                            this._currentSheetName = sheetName;
                        }
                    }
                });
    
                if (!this._currentSheetName && this._sheetNames.length > 0) {
                    this._currentSheetName = this._sheetNames[0];
                }
            } else {
                console.error("Sheet container not found");
            }
        } catch (error) {
            console.error("Error fetching sheet names:", error);
        }
    }

    async _onSheetSelect(event) {
        const newSheetName = event.target.value;
        this._currentSheetName = newSheetName;
        await this.actor.setFlag("sheexcel", "currentSheetName", newSheetName);
        
        for (let i = 0; i < this._cellReferences.length; i++) {
            await this._updateCellValue(i);
        }
    }

    async _fetchCellValue(sheetId, sheetName, cellRef) {

        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&range=${cellRef}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = (await response.text()).trim().replace(/^"(.*)"$/, "$1");
        return text;
    }

    _setupZoom(html, iframe) {
        const zoomSlider = html.find("#sheexcel-zoom-slider")[0];
        const zoomValue = html.find("#sheexcel-zoom-value")[0];
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
        const hideMenuCheckbox = html.find("#sheexcel-hide-menu")[0];
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
        await this._saveZoomLevel();
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
        return super.close(...args);
    }

    async _saveZoomLevel() {
        await this.actor.setFlag("sheexcel", "zoomLevel", this._currentZoomLevel);
    }

    getSheexcelValue(keyword) {
        return this.actor.system.sheexcel[keyword] || null;
    }
}