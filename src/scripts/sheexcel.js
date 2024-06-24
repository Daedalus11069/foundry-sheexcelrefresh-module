Hooks.once('init', async function() {
    console.log('Sheexcel | Initializing Sheexcel Module');

    // Register a new sheet class
    Actors.registerSheet("sheexcel", SheexcelActorSheet, {
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

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.update-sheet').click(this._onUpdateSheet.bind(this));
        
        // Resize iframe after it loads
        const iframe = html.find('iframe')[0];
        if (iframe) {
            iframe.onload = () => this._resizeIframe(iframe);
        }
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

    _resizeIframe(iframe) {

        // Inject custom CSS to hide elements
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
            }
        `;
        iframe.contentDocument.head.appendChild(style);
    }
}