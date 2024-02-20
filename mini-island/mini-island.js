/**
 * Define a MiniIsland class to encapsulate the behaviour of our custom element, <mini-island>
 * This class extends htmlelement where the HTMLElement interface represents any HTML element.
 */
class MiniIsland extends HTMLElement {
    /**
     * Define the name for the custom element as a static class property.
     * Custom element names require a dash to be used in them (kebab-case).
     * The name can't be a single word. Yes: mini-island. No: miniIsland.
     */
    static tagName = "mini-island";
    /**
     * Define the island element attributes
     * , e.g., <mini-island data-island>
     */
    static attributes = {
        dataIsland: "data-island",
    };

    /**
     * The connectedCallback is a part of the custom elements lifecycle callback.
     * It is invoked anytime the custom element is attached to the DOM.
     */
    async connectedCallback() {
        /**
         * As soon as the island is connected, we will go ahead and hydrate the island
         */
        await this.hydrate();
    }

    async hydrate() {
        /**
         * Conditions will hold an array of potential promises to be resolved before hydration
         */
        const conditions = [];

        /**
         * Get the condition - attribute value map
         * NB: the argument passed to `Conditions.getConditions`is the island node
         */
        let conditionAttributesMap = Conditions.getConditions(this);

        /**
         * Loop over the conditionAttributesMap variable
         */
        for (const condition in conditionAttributesMap) {
            /**
             * Grab the condition async function from the static map
             * Remember that the function that returns a promise when invoked
             */
            const conditionFn = Conditions.map[condition];

            /**
             * Check to see if the condition function exists
             */
            if (conditionFn) {
                /**
                 * Invoke the condition function with two arguments:
                 * (1) The value of the condition attribute set on the node
                 * (2) The node, i.e., the island DOM node
                 */
                const conditionPromise = conditionFn(
                    conditionAttributesMap[condition],
                    this
                );

                /**
                 * Append the promise to the conditions array
                 */
                conditions.push(conditionPromise);
            }

            /**
             * Await all promise conditions to be resolved before replacing the template nodes
             */
            await Promise.all(conditions);
            /**
             * Retrieve the relevant <template> child elements of the island
             */
            const relevantChildTemplates = this.getTemplates();
            /**
             * Grab the DOM subtree in the template and replace the template with live content.
             */
            this.replaceTemplates(relevantChildTemplates);
        }

        /**
         * Retrieve the relevant <template> child elements of the island
         */
        const relevantChildTemplates = this.getTemplates();
        /**
         * Grab the DOM subtree within the template and replace the template with live content
         */
        this.replaceTemplates(relevantChildTemplates);
    }

    getTemplates() {
        /**
         * querySelectorAll() returns a list of the document's elements that match the specified group of selectors.
         * The selector, in this case, is of the form "template[data-island]".
         * , i.e., this.querySelectorAll("template[data-island]")
         */
        return this.querySelectorAll(
            `template[${MiniIsland.attributes.dataIsland}]`
        );
    }

    replaceTemplates(templates) {
        /**
         * Iterate over all nodes in the template list.
         * templates refer to a NodeList of templates
         * node refers to a single <template>
         */
        for (const node of templates) {
            /**
             * replace the <template> with its HTML content
             * e.g., <template><p>Hello</p></template> becomes <p>Hello</p>
             */
            node.replaceWith(node.content);
        }
    }
}

class Conditions {
    /**
     * A map of loading conditions and their respective async methods
     */
    static map = {
        idle: Conditions.waitForIdle,
        visible: Conditions.waitForVisible,
        media: Conditions.waitForMedia,
    };

    static waitForIdle() {
        return new Promise((resolve) => resolve());
    }

    static waitForVisible(noop, el) {
        /**
         * If the Intersection Observer API is not available, go ahead and exist immediately.
         */
        if (!("IntersectionObserver" in window)) {
            return;
        }

        /**
         * Otherwise, set up a new Promise that is resolved when the
         * node parameter (out island DOM node) is visible
         */
        return new Promise((resolve) => {
            let observer = new IntersectionObserver((entries) => {
                let [entry] = entries;

                /**
                 * Is it visible?
                 */
                if (entry.isIntersecting) {
                    /**
                     * remote observer
                     */
                    observer.unobserve(entry.target);
                    /**
                     * Resolve promise
                     */
                    resolve();
                }
            });

            /**
             * Set up the observer on the "el" argument
             */
            observer.observe(el);
        });
    }

    static waitForMedia() {
        return new Promise((resolve) => resolve());
    }

    static getConditions(node) {
        /**
         * The result variable will hold the
         * key:value representing condition:attribue.
         * e.g., For <mini-island client:visible>
         * result should be { visible: "" }
         * and for <mini-island client:media="(max-width: 400px)"
         * result should be { media: "(max-width: 400px)" }
         */
        let result = {};

        /**
         * Loop over all keys of the static map,
         * , i.e., ["idle", "visible", "media"]
         */
        for (const condition of Object.keys(Conditions.map)) {
            /**
             * Check if the node as the attribute
             * of the form "client:${key}".
             */
            if (node.hasAttribute(`client:${condition}`)) {
                /**
                 * If the node has the attribute...
                 * save the condition (key) - attribute (value)
                 * to the result object
                 */
                result[condition] = node.getAttribute(`client:${condition}`);
            }
        }
        /** Return the result */
        return result;
    }

    static hasConditions(node) {
        /**
         * Using the "getConditions" static class method, retrieve
         * a conditions attributes map
         */
        const conditionAttributesMap = Conditions.getConditions(node);

        /**
         * Check the length of the result keys to determine if there are
         * any loading conditions on the node
         */
        return Object.keys(conditionAttributesMap).length > 0;
    }
}

/**
 * Our solution relies heavily on web components. Check that browser
 * supports web components via the 'customElements' property
 */

if ('customElements' in window) {
    /**
     * Register our custom element on the CustomElementRegistry object using the define method.
     * 
     * NB: The CustomElementRegistry interface provides methods for registering custom elements and querying registered elements.
     * 
     * NB: The arguments to the define method are the name of the custom element (mii-island)
     * and the class (MiniIsland) that defines the behaviour of the custom element.
     * 
     * NB: "MiniIsland.tagName" below represents the static class property, i.e., "static tagName".
     */
    window.customElements.define(MiniIsland.tagName, MiniIsland);
} else {
    /**
     * Custom elements not supported, log an error to the console
     */
    console.error(
        "Island cannot be initiated becase Window.customElements is unavailable."
    );
}