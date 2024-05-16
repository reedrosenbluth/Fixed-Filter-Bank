import View from "../View.jsx";

export async function makeEnvironment() {
  let CmajorSingletonPatchConnection = undefined;

  if (window.frameElement && window.frameElement.CmajorSingletonPatchConnection)
    CmajorSingletonPatchConnection =
      window.frameElement.CmajorSingletonPatchConnection;

  return { View, patchConnection: CmajorSingletonPatchConnection };
}
