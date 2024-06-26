Hooks.once('init', async function() {
    console.log('Sheexcel | Initializing Sheexcel Module');

    Actors.registerSheet("sheexcel", SheexcelActorSheet, {
        label: "Sheexcel",
        types: ["character", "npc"],
        makeDefault: false
    });
});

Hooks.once('ready', async function() {
    console.log('Sheexcel | Ready');
});

class SheexcelActorSheet extends ActorSheet {
    constructor(...args) {
        super(...args);
        this._currentZoomLevel = this.actor.getFlag("sheexcel", "zoomLevel") || 100;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["sheet", "actor", "sheexcel"],
            template: "modules/sheexcel/templates/sheet-template.html",
            width: 1200,
            height: 700,
            resizable: true
        });
    }

    getData() {
        const data = super.getData();
        data.sheetUrl = this.actor.getFlag("sheexcel", "sheetUrl") || "";
        data.zoomLevel = this._currentZoomLevel;
        data.hideMenu = this.actor.getFlag("sheexcel", "hideMenu") ?? true;
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.sheexcel-update-sheet').click(this._onUpdateSheet.bind(this));

        const iframe = html.find('.sheexcel-iframe')[0];
        this._setupZoom(html, iframe);
        this._setupHideMenu(html, iframe);

        this._applyZoom(iframe, this._currentZoomLevel);
    }

    async _onUpdateSheet(event) {
        event.preventDefault();
        let sheetUrl = this.element.find('input[name="sheetUrl"]').val();
        
        if (sheetUrl && !sheetUrl.endsWith('/edit')) {
            sheetUrl += '/edit';
        }
        
        await this.actor.setFlag("sheexcel", "sheetUrl", sheetUrl);
        this.render(false);
    }

    _setupZoom(html, iframe) {
        const zoomSlider = html.find('#sheexcel-zoom-slider')[0];
        const zoomValue = html.find('#sheexcel-zoom-value')[0];
        if (zoomSlider && zoomValue) {
            zoomSlider.addEventListener('input', (event) => {
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
            iframe.style.transformOrigin = 'top left';
            iframe.style.width = `${100 * (100 / zoomLevel)}%`;
            iframe.style.height = `${100 * (100 / zoomLevel)}%`;
        }
    }

    _setupHideMenu(html, iframe) {
        const hideMenuCheckbox = html.find('#sheexcel-hide-menu')[0];
        if (hideMenuCheckbox) {
            hideMenuCheckbox.addEventListener('change', async (event) => {
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

        const rmParam = hideMenu ? 'minimal' : 'embedded';
        iframe.src = `${sheetUrl}?embedded=true&rm=${rmParam}`;
    }

    async close(...args) {
        await this._saveZoomLevel();
        return super.close(...args);
    }

    async _saveZoomLevel() {
        if (this._currentZoomLevel !== this.actor.getFlag("sheexcel", "zoomLevel")) {
            await this.actor.setFlag("sheexcel", "zoomLevel", this._currentZoomLevel);
        }
    }
}