import {
  Button,
  Container,
  render,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { emit } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useCallback } from "preact/hooks";

import {
  FindBoundVariablesHandler,
  PackPagesHandler,
  UnpackPagesHandler,
} from "./types";

function Plugin() {
  const handlePackPagesButtonClick = useCallback(function () {
    emit<PackPagesHandler>("PACK_PAGES");
  }, []);

  const handleUnpackPagesButtonClick = useCallback(function () {
    emit<UnpackPagesHandler>("UNPACK_PAGES");
  }, []);

  const handleFindBoundVariablesButtonClick = useCallback(function () {
    emit<FindBoundVariablesHandler>("FIND_BOUND_VARIABLES");
  }, []);

  return (
    <Container space="medium">
      <VerticalSpace space="extraLarge" />
      <Button fullWidth onClick={handlePackPagesButtonClick}>
        Pack Pages ↓
      </Button>
      <VerticalSpace space="medium" />
      <hr
        style={{ border: "none", borderTop: "1px solid #ccc", margin: "0" }}
      />
      <VerticalSpace space="medium" />
      <Button fullWidth onClick={handleFindBoundVariablesButtonClick}>
        Find bound variables
      </Button>
      <VerticalSpace space="medium" />
      <hr
        style={{ border: "none", borderTop: "1px solid #ccc", margin: "0" }}
      />
      <VerticalSpace space="medium" />
      <Button fullWidth onClick={handleUnpackPagesButtonClick}>
        Unpack Pages ↑
      </Button>
      <VerticalSpace space="large" />
    </Container>
  );
}

export default render(Plugin);
