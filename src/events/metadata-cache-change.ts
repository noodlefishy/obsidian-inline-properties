import LiveVariables from "src/main";
import { refreshAllLiveVariables } from "src/editor/live-variable-extension";

const metadataCacheChangeEvent = (plugin: LiveVariables) =>
	plugin.app.metadataCache.on("changed", (file, _, cache) => {
		const frontmatterProperties = cache.frontmatter;
		const propertyChanged = plugin.vaultProperties.propertyChanged(
			frontmatterProperties
		);
		if (propertyChanged) {
			plugin.vaultProperties.updateFileProperties(file);
			refreshAllLiveVariables(plugin);
		}
	});

export default metadataCacheChangeEvent;