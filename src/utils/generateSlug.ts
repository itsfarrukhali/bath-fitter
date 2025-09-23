function generateSlug(title: string): string {
  return title
    .toLowerCase() // sab chhoti letters
    .trim() // start/end spaces hatao
    .replace(/[^\w\s-]/g, "") // special chars hatao
    .replace(/\s+/g, "-"); // spaces ko "-" mein badlo
}

export default generateSlug;
