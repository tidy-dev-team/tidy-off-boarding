import {
  Button,
  Columns,
  Container,
  render,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { emit } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useCallback } from "preact/hooks";

import {
  CloseHandler,
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

  const handleCloseButtonClick = useCallback(function () {
    emit<CloseHandler>("CLOSE");
  }, []);

  return (
    <Container space="medium">
      <VerticalSpace space="extraLarge" />
      <Button fullWidth onClick={handlePackPagesButtonClick}>
        Pack Pages
      </Button>
      <VerticalSpace space="small" />
      <Button fullWidth onClick={handleFindBoundVariablesButtonClick}>
        Find bound variables
      </Button>
      <VerticalSpace space="small" />
      <Button fullWidth onClick={handleUnpackPagesButtonClick}>
        Unpack Pages
      </Button>
      <VerticalSpace space="large" />
      <Columns space="extraSmall">
        <Button fullWidth onClick={handleCloseButtonClick} secondary>
          Close
        </Button>
      </Columns>
      <VerticalSpace space="small" />
    </Container>
  );
}

export default render(Plugin);
