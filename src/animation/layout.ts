export function heroSceneCenter(root: ParentNode, viewportHeight: number): number {
  const title = root.querySelector<HTMLElement>(".hero-title");
  const description = root.querySelector<HTMLElement>(".protocol");

  if (!title || !description) {
    return viewportHeight * 0.5;
  }

  const titleBottom = Math.max(0, Math.min(viewportHeight, title.getBoundingClientRect().bottom));
  const descriptionTop = Math.max(0, Math.min(viewportHeight, description.getBoundingClientRect().top));

  return descriptionTop > titleBottom
    ? (titleBottom + descriptionTop) * 0.5
    : viewportHeight * 0.5;
}
