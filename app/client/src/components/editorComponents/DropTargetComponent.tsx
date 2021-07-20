import React, {
  useState,
  ReactNode,
  Context,
  createContext,
  memo,
  useRef,
  useEffect,
} from "react";
import styled from "styled-components";
import { WidgetProps } from "widgets/BaseWidget";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import {
  MAIN_CONTAINER_WIDGET_ID,
  GridDefaults,
} from "constants/WidgetConstants";
import { calculateDropTargetRows } from "./DropTargetUtils";
import DragLayerComponent from "./DragLayerComponent";
import { AppState } from "reducers";
import { useSelector } from "react-redux";
import {
  useShowPropertyPane,
  useCanvasSnapRowsUpdateHook,
} from "utils/hooks/dragResizeHooks";
import { getOccupiedSpaces } from "selectors/editorSelectors";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";

type DropTargetComponentProps = WidgetProps & {
  children?: ReactNode;
  snapColumnSpace: number;
  snapRowSpace: number;
  minHeight: number;
  noPad?: boolean;
};

const StyledDropTarget = styled.div`
  transition: height 100ms ease-in;
  width: 100%;
  position: relative;
  background: none;
  user-select: none;
`;

function Onboarding() {
  return (
    <div style={{ position: "fixed", left: "50%", top: "50vh" }}>
      <h2 style={{ color: "#ccc" }}>Drag and drop a widget here</h2>
    </div>
  );
}

/*
  This context will provide the function which will help the draglayer and resizablecomponents trigger
  an update of the main container's rows
*/
export const DropTargetContext: Context<{
  updateDropTargetRows?: (
    widgetId: string,
    widgetBottomRow: number,
  ) => number | false;
  persistDropTargetRows?: (widgetId: string, row: number) => void;
  handleBoundsUpdate?: (rect: DOMRect) => void;
  dropRef?: React.RefObject<HTMLDivElement>;
}> = createContext({});

export function DropTargetComponent(props: DropTargetComponentProps) {
  const canDropTargetExtend = props.canExtend;

  const snapRows = getCanvasSnapRows(props.bottomRow, props.canExtend);

  const occupiedSpaces = useSelector(getOccupiedSpaces);
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const childWidgets = useSelector(
    (state: AppState) => state.entities.canvasWidgets[props.widgetId].children,
  );

  const occupiedSpacesByChildren =
    occupiedSpaces && occupiedSpaces[props.widgetId];

  const [rows, setRows] = useState(snapRows);

  const showPropertyPane = useShowPropertyPane();
  const { deselectAll, focusWidget } = useWidgetSelection();
  const updateCanvasSnapRows = useCanvasSnapRowsUpdateHook();

  useEffect(() => {
    const snapRows = getCanvasSnapRows(props.bottomRow, props.canExtend);
    setRows(snapRows);
  }, [props.bottomRow, props.canExtend]);

  const persistDropTargetRows = (widgetId: string, widgetBottomRow: number) => {
    const newRows = calculateDropTargetRows(
      widgetId,
      widgetBottomRow,
      props.minHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT - 1,
      occupiedSpacesByChildren,
    );
    const rowsToPersist = Math.max(
      props.minHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT - 1,
      newRows,
    );
    setRows(rowsToPersist);
    if (canDropTargetExtend) {
      updateCanvasSnapRows(props.widgetId, rowsToPersist);
    }
  };

  /* Update the rows of the main container based on the current widget's (dragging/resizing) bottom row */
  const updateDropTargetRows = (widgetId: string, widgetBottomRow: number) => {
    if (canDropTargetExtend) {
      const newRows = calculateDropTargetRows(
        widgetId,
        widgetBottomRow,
        props.minHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT - 1,
        occupiedSpacesByChildren,
      );

      if (rows < newRows) {
        setRows(newRows + 1);
        return newRows;
      }
      return false;
    }
    return false;
  };

  const handleFocus = (e: any) => {
    if (!isResizing && !isDragging) {
      if (!props.parentId) {
        deselectAll();
        focusWidget && focusWidget(props.widgetId);
        showPropertyPane && showPropertyPane();
      }
    }
    // commenting this out to allow propagation of click events
    // e.stopPropagation();
    e.preventDefault();
  };
  const height = canDropTargetExtend
    ? `${Math.max(rows * props.snapRowSpace, props.minHeight)}px`
    : "100%";

  const boxShadow =
    (isResizing || isDragging) && props.widgetId === MAIN_CONTAINER_WIDGET_ID
      ? "0px 0px 0px 1px #DDDDDD"
      : "0px 0px 0px 1px transparent";
  const dropRef = useRef<HTMLDivElement>(null);

  return (
    <DropTargetContext.Provider
      value={{
        updateDropTargetRows,
        persistDropTargetRows,
      }}
    >
      <StyledDropTarget
        className={"t--drop-target"}
        onClick={handleFocus}
        ref={dropRef}
        style={{
          height,
          boxShadow,
        }}
      >
        {props.children}
        {!(childWidgets && childWidgets.length) &&
          !isDragging &&
          !props.parentId && <Onboarding />}
        {(isDragging || isResizing) && (
          <DragLayerComponent
            noPad={props.noPad || false}
            parentColumnWidth={props.snapColumnSpace}
            parentRowHeight={props.snapRowSpace}
          />
        )}
      </StyledDropTarget>
    </DropTargetContext.Provider>
  );
}

const MemoizedDropTargetComponent = memo(DropTargetComponent);

export default MemoizedDropTargetComponent;
