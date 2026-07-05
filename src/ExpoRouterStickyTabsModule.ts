import { NativeModule, requireNativeModule } from 'expo';

declare class ExpoRouterStickyTabsModule extends NativeModule<{}> {}

export default requireNativeModule<ExpoRouterStickyTabsModule>('ExpoRouterStickyTabs');
