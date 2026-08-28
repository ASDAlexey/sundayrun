import { POSTER_IMAGE_TYPE, POSTER_PIXEL_RATIO, POSTER_SVG_MEDIA_TYPE } from './plan-poster.constant';
import { type PlanImageRequest } from './plan-image.interface';

/**
 * Turns the poster into a PNG and hands it to the visitor the way their device hands files over.
 *
 * The share sheet first, when the platform offers one for files: on a phone that is the route to
 * «Сохранить в Фото», which is where a plan belongs the morning it is used, and it is the only
 * route on iOS — a `download` attribute there saves into Files, several taps from the camera roll,
 * or is ignored outright. A download link otherwise, which is what a desktop expects.
 *
 * PNG rather than the SVG itself, even though the SVG is what was drawn and is a tenth the size.
 * A photo library will not take an SVG, a messenger will not preview one, and the point of the
 * picture is that it can be kept and shown without this site.
 *
 * Resolves false when the browser gives nothing to work with — no 2D context, no blob — and when
 * the visitor dismisses the share sheet, so the card can say so rather than pretend it saved.
 */
export async function savePlanImage({ svg, fileName, document }: PlanImageRequest): Promise<boolean> {
  const blob = await rasterise(svg, document);

  if (!blob) {
    return false;
  }

  const file = new File([blob], fileName, { type: POSTER_IMAGE_TYPE });

  return (await share(file)) || download({ blob, fileName, document });
}

/** The poster drawn at twice its declared size, so it is not a blurry thumbnail on a desktop. */
async function rasterise(svg: string, document: Document): Promise<Blob | null> {
  const source = await load(`data:${POSTER_SVG_MEDIA_TYPE},${encodeURIComponent(svg)}`);

  if (!source) {
    return null;
  }

  const canvas = document.createElement('canvas');

  canvas.width = source.width * POSTER_PIXEL_RATIO;
  canvas.height = source.height * POSTER_PIXEL_RATIO;

  const context = canvas.getContext('2d');

  if (!context) {
    return null;
  }

  context.drawImage(source, 0, 0, canvas.width, canvas.height);

  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, POSTER_IMAGE_TYPE));
}

/**
 * A decoded image, or nothing.
 *
 * Rejecting would be the tidier signature, but every caller of this would immediately catch and
 * fall back, and there is no diagnosis to be had: the load fails because the browser refused to
 * decode the document, and it never says why.
 */
function load(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = (): void => resolve(image);
    image.onerror = (): void => resolve(null);
    image.src = url;
  });
}

/**
 * The platform share sheet, when it takes files. Declining it is a decision, not a failure: the
 * dismissal rejects, and the caller then has nothing left to do.
 */
async function share(file: File): Promise<boolean> {
  if (typeof navigator.canShare !== 'function' || !navigator.canShare({ files: [file] })) {
    return false;
  }

  try {
    await navigator.share({ files: [file] });

    return true;
  } catch {
    return true;
  }
}

function download({ blob, fileName, document }: { blob: Blob; fileName: string; document: Document }): boolean {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);

  return true;
}
