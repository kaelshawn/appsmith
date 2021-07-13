import { takeLeading, all, put, select } from "redux-saga/effects";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import history from "../utils/history";
import { BUILDER_PAGE_URL } from "../constants/routes";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "../selectors/editorSelectors";
import { ActionData } from "../reducers/entityReducers/actionsReducer";
import { getCanvasWidgets } from "../selectors/entitiesSelector";
import { updateWidgetPropertyRequest } from "../actions/controlActions";
import { RenderModes, WidgetTypes } from "../constants/WidgetConstants";
import { Toaster } from "../components/ads/Toast";
import { Variant } from "../components/ads/common";

export function* bindDataToWidgetSaga(
  action: ReduxAction<{
    widgetId: string;
  }>,
) {
  const applicationId = yield select(getCurrentApplicationId);
  const pageId = yield select(getCurrentPageId);
  // console.log("Binding Data in Saga");
  const currentURL = new URL(window.location.href);
  const searchParams = currentURL.searchParams;
  const queryId = searchParams.get("bindTo");
  const currentAction = yield select((state) =>
    state.entities.actions.find(
      (action: ActionData) => action.config.id === queryId,
    ),
  );
  const selectedWidget = (yield select(getCanvasWidgets))[
    action.payload.widgetId
  ];

  let propertyPath = "";
  let propertyValue: any = "";
  let isValidProperty = true;

  switch (selectedWidget.type) {
    case WidgetTypes.BUTTON_WIDGET:
      propertyPath = "onClick";
      propertyValue = `{{${currentAction.config.name}.run()}}`;
      break;
    case WidgetTypes.CHECKBOX_WIDGET:
      propertyPath = "defaultCheckedState";
      propertyValue = !!currentAction.data.body;
      break;
    case WidgetTypes.DATE_PICKER_WIDGET2:
      propertyPath = "defaultDate";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.FILE_PICKER_WIDGET:
      propertyPath = "onFilesSelected";
      propertyValue = `{{${currentAction.config.name}.run()}}`;
      break;
    case WidgetTypes.IFRAME_WIDGET:
      propertyPath = "source";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.INPUT_WIDGET:
      propertyPath = "defaultText";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.LIST_WIDGET:
      propertyPath = "items";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.MAP_WIDGET:
      propertyPath = "defaultMarkers";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.RADIO_GROUP_WIDGET:
      propertyPath = "options";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.RATE_WIDGET:
      propertyPath = "onRateChanged";
      propertyValue = `{{${currentAction.config.name}.run()}}`;
      break;
    case WidgetTypes.RICH_TEXT_EDITOR_WIDGET:
      propertyPath = "defaultText";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.DROP_DOWN_WIDGET:
      propertyPath = "options";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.SWITCH_WIDGET:
      propertyPath = "defaultSwitchState";
      propertyValue = !!currentAction.data.body;
      break;
    case WidgetTypes.TABLE_WIDGET:
      propertyPath = "tableData";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.TEXT_WIDGET:
      propertyPath = "text";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.VIDEO_WIDGET:
      propertyPath = "url";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    default:
      isValidProperty = false;
      break;
  }
  if (queryId && isValidProperty) {
    yield put(
      updateWidgetPropertyRequest(
        action.payload.widgetId,
        propertyPath,
        propertyValue,
        RenderModes.CANVAS,
      ),
    );
    yield put({
      type: ReduxActionTypes.SHOW_PROPERTY_PANE,
      payload: {
        widgetId: action.payload.widgetId,
        callForDragOrResize: undefined,
        force: true,
      },
    });
  } else {
    queryId &&
      Toaster.show({
        text: "Binding on selection is not supported for this type of widget!",
        variant: Variant.warning,
      });
  }
  history.replace(BUILDER_PAGE_URL(applicationId, pageId, {}));
}

export default function* propertyPaneSagas() {
  yield all([
    takeLeading(ReduxActionTypes.BIND_DATA_TO_WIDGET, bindDataToWidgetSaga),
  ]);
}
