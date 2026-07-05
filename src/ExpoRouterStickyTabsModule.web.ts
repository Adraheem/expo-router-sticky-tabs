import { registerWebModule, NativeModule } from 'expo';

class ExpoRouterStickyTabsModule extends NativeModule<{}> {}

export default registerWebModule(ExpoRouterStickyTabsModule, 'ExpoRouterStickyTabsModule');
