# Verified portfolio sources

Audited against GitHub's public repository API and the live GitHub Pages HTML on **7 October 2026**. Commit IDs below pin the reviewed sources; they are not claims that external deployments will never change.

| Repository | Purpose | Reviewed commit |
| --- | --- | --- |
| [jadhavgaurav.github.io](https://github.com/jadhavgaurav/jadhavgaurav.github.io) | Current editorial portfolio at https://jadhavgaurav.github.io/. **Primary design and interaction source for this migration.** | `497135116f8a84b47a2e8a2e000d822ba6515fad` |
| [the-world](https://github.com/jadhavgaurav/the-world) | Separate Next.js / React Three Fiber 3D portfolio, embedded on request from the main site. Public deployment: https://gaurav-portfolio-theta.vercel.app/. | `f1b9d4cab55b329c93bc601cd60e5fc169c9d540` |
| [bitling](https://github.com/jadhavgaurav/bitling) | Desktop pet and its public browser demo, used by the main site's opt-in playground. | `c77968500561a2f35ca9660d47b02a1794737f13` |
| [github-mirror](https://github.com/jadhavgaurav/github-mirror) | Separate visualization experiment. Retained as an archived project story; it must not replace The World on the current homepage. | `c4fbc1e91355a5a634e6f9c7dc424cfeadd97c49` |
| [my-portfolio](https://github.com/jadhavgaurav/my-portfolio) | Earlier Python / Streamlit portfolio from June 2025. Historical source, not the current design. | `24481c0aa831492833d81db337892d428b14dc98` |
| [jadhavgaurav](https://github.com/jadhavgaurav/jadhavgaurav) | GitHub profile README. Parent workspace, not the portfolio website. | `fff4af8e2989de4165d41a17d46baa551ae64aef` |

The current GitHub Pages homepage matched the local source at the pinned commit after CRLF/LF normalization. GitHub's repository homepage metadata currently points to the contact API; that metadata is not the website's actual URL. The API lives in `contact-service/` of the main portfolio source and is deployed separately.

The Astro source lives in this independent `portfolio/` checkout. It was initially based on a separate Sites snapshot that omitted newer interactions. That snapshot is superseded as the migration's homepage baseline. Its additional evidence-backed case studies, contribution index, and timeline remain incorporated.

Intentional extensions to the verified homepage: shareable case-study routes instead of project dialogs; an AlsoNotify entry alongside OyeChats and CleanStart; a complete work archive, open-source index, and journey. Employment/ownership labels are not used to classify projects. Each story describes the author's contribution and retains public evidence, without implying sole authorship of a whole product.
