---
'uitheme-rn': patch
---

Remove the `zod` runtime dependency. The package now has no runtime dependencies, and a consumer bundle of the main entry drops from about 460 kB to about 6 kB minified. The `nativewind` peer range is now `>=5.0.0-rc.0 <6`, so a stable NativeWind 5 release does not cause a peer conflict.
