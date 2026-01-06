import {
  Button,
  Checkbox,
  Container,
  LoadingIndicator,
  render,
  Text,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";

import {
  FindBoundVariablesHandler,
  GetPagesHandler,
  OperationCompleteHandler,
  PackPagesHandler,
  PageInfo,
  PagesListHandler,
  UnpackPagesHandler,
} from "./types";

interface PageSelection extends PageInfo {
  selected: boolean;
}

function Plugin() {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [pages, setPages] = useState<PageSelection[]>([]);

  useEffect(() => {
    on<OperationCompleteHandler>("OPERATION_COMPLETE", () => {
      setLoading(false);
      setLoadingMessage("");
      // Refresh pages list after operation completes
      emit<GetPagesHandler>("GET_PAGES");
    });

    on<PagesListHandler>("PAGES_LIST", (pageList: PageInfo[]) => {
      setPages(
        pageList.map((p) => ({
          ...p,
          selected: true, // Select all by default
        }))
      );
    });

    // Request pages on mount
    emit<GetPagesHandler>("GET_PAGES");
  }, []);

  const handleSelectAll = useCallback(() => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: true })));
  }, []);

  const handleDeselectAll = useCallback(() => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: false })));
  }, []);

  const handleTogglePage = useCallback((id: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  }, []);

  const allSelected = pages.length > 0 && pages.every((p) => p.selected);
  const noneSelected = pages.every((p) => !p.selected);
  const selectedCount = pages.filter((p) => p.selected).length;

  const handlePackPagesButtonClick = useCallback(
    function () {
      const selectedIds = pages.filter((p) => p.selected).map((p) => p.id);
      if (selectedIds.length === 0) {
        return;
      }
      setLoading(true);
      setLoadingMessage("Packing pages...");
      emit<PackPagesHandler>("PACK_PAGES", selectedIds);
    },
    [pages]
  );

  const handleUnpackPagesButtonClick = useCallback(function () {
    setLoading(true);
    setLoadingMessage("Unpacking pages...");
    emit<UnpackPagesHandler>("UNPACK_PAGES");
  }, []);

  const handleFindBoundVariablesButtonClick = useCallback(function () {
    setLoading(true);
    setLoadingMessage("Scanning for variables...");
    emit<FindBoundVariablesHandler>("FIND_BOUND_VARIABLES");
  }, []);

  if (loading) {
    return (
      <Container space="medium">
        <VerticalSpace space="extraLarge" />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <LoadingIndicator />
          <Text
            align="center"
            style={{ color: "var(--figma-color-text-secondary)" }}
          >
            {loadingMessage}
          </Text>
        </div>
        <VerticalSpace space="extraLarge" />
      </Container>
    );
  }

  return (
    <Container space="medium">
      <VerticalSpace space="small" />

      {/* Select All / Deselect All controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "bold" }}>Pages to pack</Text>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleSelectAll}
            hidden={allSelected}
            style={{
              background: "none",
              border: "none",
              color: allSelected
                ? "var(--figma-color-text-disabled)"
                : "var(--figma-color-text-brand)",
              cursor: allSelected ? "default" : "pointer",
              fontSize: "11px",
              padding: "2px 4px",
            }}
          >
            All
          </button>
          <button
            onClick={handleDeselectAll}
            hidden={!allSelected}
            style={{
              background: "none",
              border: "none",
              color: noneSelected
                ? "var(--figma-color-text-disabled)"
                : "var(--figma-color-text-brand)",
              cursor: noneSelected ? "default" : "pointer",
              fontSize: "11px",
              padding: "2px 4px",
            }}
          >
            None
          </button>
        </div>
      </div>

      <VerticalSpace space="extraSmall" />

      {/* Scrollable page list */}
      <div
        style={{
          maxHeight: "150px",
          overflowY: "auto",
          border: "1px solid var(--figma-color-border)",
          borderRadius: "4px",
          padding: "4px 0",
        }}
      >
        {pages.map((page) => (
          <div
            key={page.id}
            style={{
              padding: "4px 8px",
            }}
          >
            <Checkbox
              value={page.selected}
              onValueChange={() => handleTogglePage(page.id)}
            >
              <Text>{page.name}</Text>
            </Checkbox>
          </div>
        ))}
        {pages.length === 0 && (
          <div style={{ padding: "8px", textAlign: "center" }}>
            <Text style={{ color: "var(--figma-color-text-secondary)" }}>
              No pages found
            </Text>
          </div>
        )}
      </div>

      <VerticalSpace space="small" />

      <Button
        fullWidth
        onClick={handlePackPagesButtonClick}
        disabled={noneSelected}
      >
        Pack {selectedCount > 0 ? `${selectedCount} ` : ""}Page
        {selectedCount !== 1 ? "s" : ""} ↓
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
      <VerticalSpace space="small" />
    </Container>
  );
}

export default render(Plugin);
