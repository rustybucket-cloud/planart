import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import ReferenceCollection from "./ReferenceCollection";
import { referenceCollectionApi } from "@/services/referenceCollectionApi";
import { resetPendingNewCollectionIdForTesting } from "./collectionNewRefState";
import type { ReferenceCollectionData } from "@/types/referenceCollection";

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/services/referenceCollectionApi", () => ({
  referenceCollectionApi: {
    create: vi.fn(),
    save: vi.fn(),
    load: vi.fn(),
    list: vi.fn(),
    delete: vi.fn(),
    fetchImageFromUrl: vi.fn(),
  },
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  readFile: vi.fn(),
}));

function renderWithRoute(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/collection/${id}`]}>
      <Routes>
        <Route
          path="/collection/:id"
          element={<ReferenceCollection />}
        />
      </Routes>
    </MemoryRouter>
  );
}

const mockCollection: ReferenceCollectionData = {
  id: "test-col-1",
  name: "Test Collection",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  images: [
    {
      id: "img-1",
      content: "data:image/png;base64,abc123",
      tags: ["landscape"],
      addedAt: new Date().toISOString(),
      note: "A nice landscape",
    },
    {
      id: "img-2",
      content: "data:image/png;base64,def456",
      tags: [],
      addedAt: new Date().toISOString(),
    },
  ],
};

describe("ReferenceCollection Page", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    resetPendingNewCollectionIdForTesting();
    vi.mocked(referenceCollectionApi.load).mockResolvedValue(mockCollection);
    vi.mocked(referenceCollectionApi.save).mockResolvedValue(undefined);
    vi.mocked(referenceCollectionApi.create).mockResolvedValue({
      id: "new-col-id",
      name: "Untitled Collection",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      images: [],
    });
  });

  it("should load and display collection name and image count", async () => {
    renderWithRoute("test-col-1");

    await waitFor(() => {
      expect(screen.getByText("Test Collection")).toBeInTheDocument();
    });
    expect(screen.getByText("2 images")).toBeInTheDocument();
  });

  it("should redirect to new collection when id is 'new'", async () => {
    renderWithRoute("new");

    await waitFor(() => {
      expect(referenceCollectionApi.create).toHaveBeenCalledWith(
        "Untitled Collection"
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith("/collection/new-col-id", {
      replace: true,
    });
  });

  it("should navigate home when back button is clicked", async () => {
    renderWithRoute("test-col-1");

    await waitFor(() => {
      expect(screen.getByText("Test Collection")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Back to home"));

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("should show empty state when collection has no images", async () => {
    vi.mocked(referenceCollectionApi.load).mockResolvedValue({
      ...mockCollection,
      images: [],
    });

    renderWithRoute("test-col-1");

    await waitFor(() => {
      expect(
        screen.getByText("No reference images yet")
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/paste images directly/i)).toBeInTheDocument();
  });

  it("should render image tiles for collection images", async () => {
    renderWithRoute("test-col-1");

    await waitFor(() => {
      expect(screen.getByText("Test Collection")).toBeInTheDocument();
    });

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "data:image/png;base64,abc123");
    expect(images[1]).toHaveAttribute("src", "data:image/png;base64,def456");
  });

  it("should show URL input bar when URL button is clicked", async () => {
    renderWithRoute("test-col-1");

    await waitFor(() => {
      expect(screen.getByText("Test Collection")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText("URL"));

    expect(
      screen.getByPlaceholderText("Paste image URL...")
    ).toBeInTheDocument();
  });

  it("should close URL input bar when close button is clicked", async () => {
    renderWithRoute("test-col-1");

    await waitFor(() => {
      expect(screen.getByText("Test Collection")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText("URL"));
    expect(
      screen.getByPlaceholderText("Paste image URL...")
    ).toBeInTheDocument();

    await user.click(screen.getByLabelText("Close URL input"));
    expect(
      screen.queryByPlaceholderText("Paste image URL...")
    ).not.toBeInTheDocument();
  });

  it("should allow editing the collection name", async () => {
    renderWithRoute("test-col-1");

    await waitFor(() => {
      expect(screen.getByText("Test Collection")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    // Click the name to start editing
    await user.click(screen.getByText("Test Collection"));

    // Should now show an input with the current name
    const nameInput = screen.getByDisplayValue("Test Collection");
    expect(nameInput).toBeInTheDocument();

    // Clear and type a new name
    await user.clear(nameInput);
    await user.type(nameInput, "Renamed Collection");
    await user.keyboard("{Enter}");

    // Name should now display the new value
    expect(screen.getByText("Renamed Collection")).toBeInTheDocument();
  });

  it("should open lightbox when an image is clicked", async () => {
    renderWithRoute("test-col-1");

    await waitFor(() => {
      expect(screen.getByText("Test Collection")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const images = screen.getAllByRole("img");
    await user.click(images[0]);

    // Lightbox should show image counter
    await waitFor(() => {
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });
    expect(screen.getByText("Image viewer")).toBeInTheDocument();
  });

  it("should navigate between images in lightbox with arrow buttons", async () => {
    renderWithRoute("test-col-1");

    await waitFor(() => {
      expect(screen.getByText("Test Collection")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const images = screen.getAllByRole("img");
    await user.click(images[0]);

    await waitFor(() => {
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });

    // Navigate to next image
    await user.click(screen.getByLabelText("Next image"));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();

    // Navigate back
    await user.click(screen.getByLabelText("Previous image"));
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("should show metadata panel when toggle is clicked in lightbox", async () => {
    renderWithRoute("test-col-1");

    await waitFor(() => {
      expect(screen.getByText("Test Collection")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const images = screen.getAllByRole("img");
    await user.click(images[0]);

    await waitFor(() => {
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });

    // Toggle metadata panel
    await user.click(screen.getByLabelText("Toggle metadata panel"));

    // Should show metadata fields
    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByDisplayValue("A nice landscape")).toBeInTheDocument();
    expect(screen.getByText("landscape")).toBeInTheDocument();
  });

  it("should show save status indicator", async () => {
    renderWithRoute("test-col-1");

    await waitFor(() => {
      expect(screen.getByText("Test Collection")).toBeInTheDocument();
    });

    // Initially should show "Saved"
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });
});
