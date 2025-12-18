import { EventHandler } from "@create-figma-plugin/utilities";

export interface PackPagesHandler extends EventHandler {
  name: "PACK_PAGES";
  handler: () => void;
}

export interface UnpackPagesHandler extends EventHandler {
  name: "UNPACK_PAGES";
  handler: () => void;
}

export interface FindBoundVariablesHandler extends EventHandler {
  name: "FIND_BOUND_VARIABLES";
  handler: () => void;
}

export interface CloseHandler extends EventHandler {
  name: "CLOSE";
  handler: () => void;
}
