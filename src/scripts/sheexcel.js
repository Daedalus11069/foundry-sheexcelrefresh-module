Hooks.once('init', async function() {
    console.log('Sheexcel | Initializing Sheexcel Module');

    // Register a new sheet class
    Actors.registerSheet("sheexcel", SheexcelActorSheet, {
        label: "Sheexcel",
        types: ["character"],
        makeDefault: false
    });
});

Hooks.once('ready', async function() {
    console.log('Sheexcel | Ready');
});

class SheexcelActorSheet extends ActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["sheet", "actor", "sheexcel"],
            template: "modules/sheexcel/templates/sheet-template.html",
            width: 1200,
            height: 700,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "spreadsheet"}]
        });
    }

    getData() {
        const data = super.getData();
        data.sheetUrl = this.actor.getFlag("sheexcel", "sheetUrl") || "";
        return data;
    }

    async _onUpdateSheet(event) {
        event.preventDefault();
        let sheetUrl = this.form.sheetUrl.value;
        
        if (!sheetUrl.endsWith('/edit')) {
            sheetUrl += '/edit';
        }
        
        await this.actor.setFlag("sheexcel", "sheetUrl", sheetUrl);
        this.render(false);
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.update-sheet').click(this._onUpdateSheet.bind(this));
        
        const iframe = html.find('iframe')[0];
        if (iframe) {
            iframe.onload = () => {
                this._resizeIframe(iframe);
            };
        }

        // Always set up zoom, regardless of iframe status
        this._setupZoom(html, iframe);
    }

    _setupZoom(html, iframe) {
        const zoomSlider = html.find('#zoom-slider')[0];
        const zoomValue = html.find('#zoom-value')[0];
        if (zoomSlider && zoomValue) {
            zoomSlider.addEventListener('input', (event) => {
                const zoomLevel = event.target.value;
                zoomValue.textContent = `${zoomLevel}%`;
                this._applyZoom(iframe, zoomLevel);
            });
        } else {
            console.error('Sheexcel | Zoom slider or value element not found');
        }
    }

    _resizeIframe(iframe) {
        if (!iframe) return;

        const style = iframe.contentDocument.createElement('style');
        style.textContent = `
            #docs-chrome,
            #docs-air-bar,
            #docs-bars,
            #waffle-grid-toolbar,
            .row-headers-background,
            .column-headers-background {
                display: none !important;
            }
            .grid-container {
                margin-top: 0 !important;
                transform-origin: top left;
            }
            #sheets-viewport {
                height: 100vh !important;
                overflow: auto !important;
            }
        `;
        iframe.contentDocument.head.appendChild(style);
    }

    _applyZoom(iframe, zoomLevel) {
        if (!iframe) {
            console.error('Sheexcel | iframe not found for zoom application');
            return;
        }

        // Fallback method: apply zoom to the iframe itself
        iframe.style.transform = `scale(${zoomLevel / 100})`;
        iframe.style.transformOrigin = 'top left';
        iframe.style.width = `${100 * (100 / zoomLevel)}%`;
        iframe.style.height = `${100 * (100 / zoomLevel)}%`;

        // Try to apply zoom to iframe content if possible
        try {
            const container = iframe.contentDocument.querySelector('.grid-container');
            if (container) {
                container.style.transform = `scale(${zoomLevel / 100})`;
                container.style.width = `${10000 / zoomLevel * 100}px`;
                container.style.height = `${7000 / zoomLevel * 100}px`;
            }
        } catch (error) {
            console.warn('Sheexcel | Unable to access iframe content for zooming:', error);
        }
    }
}