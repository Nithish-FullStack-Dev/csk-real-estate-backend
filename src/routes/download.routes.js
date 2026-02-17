// src/routes/download.routes.js
import { Router } from "express";
import cloudinary from "cloudinary";
import fetch from "node-fetch"; // if Node >=18 you can use global fetch

const router = Router();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.get("/download-proxy", async (req, res) => {
  try {
    const { url, filename } = req.query;
    if (!url) return res.status(400).json({ error: "Missing file URL" });

    const inputUrl = String(url);

    // Helper: attempt to parse using regex first
    const cloudinaryRegex =
      /res\.cloudinary\.com\/[^/]+\/([^/]+)\/upload\/(?:v\d+\/)?(.+?)(?:\.(\w+))(?:$|[?\/#])/i;
    let m = inputUrl.match(cloudinaryRegex);

    let inferredResourceType = null;
    let publicId = null;
    let format = null;

    if (m) {
      inferredResourceType = m[1]; // e.g. image / raw / video
      publicId = m[2]; // public id possibly with folders
      format = m[3]; // extension like pdf, jpg
    } else {
      // Fallback parsing: find part after '/upload/'
      const part = inputUrl.split("/upload/")[1];
      if (part) {
        // remove version prefix if present
        const withoutVersion = part.replace(/^v\d+\//, "");
        // last dot separates extension
        const lastDot = withoutVersion.lastIndexOf(".");
        if (lastDot > 0) {
          publicId = withoutVersion.substring(0, lastDot);
          format = withoutVersion.substring(lastDot + 1).split(/[?#]/)[0];
        } else {
          publicId = withoutVersion.split(/[?#]/)[0];
        }
      }
    }

    // Normalize publicId: trim leading/trailing slashes
    if (publicId) publicId = publicId.replace(/^\/+|\/+$/g, "");

    // Debug logging to help you see what was parsed
    // console.log("download-proxy called for url:", inputUrl);
    // console.log(
    //   "Parsed -> publicId:",
    //   publicId,
    //   "format:",
    //   format,
    //   "inferredResourceType:",
    //   inferredResourceType
    // );

    if (!publicId || !format) {
      return res.status(400).json({
        error: "Could not parse public_id/format from Cloudinary URL",
        parsed: { publicId, format, inferredResourceType },
      });
    }

    // Candidate resource types to try (prefer inferred if present)
    const resourceTypeCandidates = inferredResourceType
      ? [inferredResourceType, "raw", "image", "video"]
      : ["raw", "image", "video"];

    // Candidate upload types to try (order matters)
    const typeCandidates = ["authenticated", "private", "upload"];

    // Try to generate a signed URL and verify it works (try HEAD)
    let signedUrl = null;
    let usedResourceType = null;
    let usedType = null;

    for (const rt of resourceTypeCandidates) {
      for (const t of typeCandidates) {
        try {
          const candidate = await cloudinary.v2.utils.private_download_url(
            publicId,
            format,
            {
              resource_type: rt,
              type: t,
              attachment: true,
            },
          );
          // quick check with HEAD to confirm it exists
          const headResp = await fetch(candidate, { method: "HEAD" });
          if (headResp.ok) {
            signedUrl = candidate;
            usedResourceType = rt;
            usedType = t;
            break;
          } else {
            console.log(
              `Signed URL HEAD check failed (${headResp.status}) for rt=${rt} type=${t}`,
            );
          }
        } catch (err) {
          // ignore and try next
          console.log(
            `private_download_url failed for rt=${rt} type=${t}`,
            err.message || err,
          );
        }
      }
      if (signedUrl) break;
    }

    // If still not found, try to inspect resource via Cloudinary API (for debugging)
    if (!signedUrl) {
      let foundInfo = null;
      for (const rt of resourceTypeCandidates) {
        try {
          const info = await cloudinary.v2.api.resource(publicId, {
            resource_type: rt,
          });
          if (info) {
            foundInfo = { resourceType: rt, info };
            break;
          }
        } catch (err) {
          // not found for this resource_type
        }
      }
      console.log("resource lookup result:", foundInfo);
      if (!foundInfo) {
        return res.status(404).json({
          error: "Cloudinary resource not found with parsed public_id/format",
          parsed: { publicId, format, inferredResourceType },
        });
      } else {
        // If resource exists per API, attempt one more time with its resourceType
        try {
          const candidate = await cloudinary.v2.utils.private_download_url(
            publicId,
            format,
            {
              resource_type: foundInfo.resourceType,
              type: "authenticated",
              attachment: true,
            },
          );
          const headResp = await fetch(candidate, { method: "HEAD" });
          if (headResp.ok) {
            signedUrl = candidate;
            usedResourceType = foundInfo.resourceType;
            usedType = "authenticated";
          }
        } catch (err) {
          console.log("final attempt private_download_url failed", err);
        }
      }
    }

    if (!signedUrl) {
      return res.status(502).json({
        error:
          "Unable to generate usable signed download URL for Cloudinary asset",
        parsed: {
          publicId,
          format,
          inferredResourceType,
          tried: { resourceTypeCandidates, typeCandidates },
        },
      });
    }

    // console.log(
    //   "Signed URL created. resource_type:",
    //   usedResourceType,
    //   "type:",
    //   usedType
    // );
    return res.redirect(signedUrl);
  } catch (err) {
    console.error("Download proxy error:", err);
    return res
      .status(500)
      .json({ error: "Internal server error during file download" });
  }
});

export default router;
