// Reddit Ads Remover & NSFW Unlocker
// Optimized for Surge and Stash
// Supports both JSON (API) and HTML (Shreddit/SSR)

let body = $response.body;

if (body) {
  if (body.trim().startsWith('<')) {
    // HTML removal is limited to known ad containers to avoid layout breakage.
    let modified = false;

    const tagsToRemove = [
      'shreddit-comments-page-ad',
      'shreddit-ad-post',
      'shreddit-feed-ad-post',
      'shreddit-comment-tree-ad'
    ];

    for (let tag of tagsToRemove) {
      const startTag = `<${tag}`;
      const endTag = `</${tag}>`;

      let startIndex = 0;
      while ((startIndex = body.indexOf(startTag, startIndex)) !== -1) {
        let endIndex = body.indexOf(endTag, startIndex);
        if (endIndex !== -1) {
          endIndex += endTag.length;
          body = body.substring(0, startIndex) + body.substring(endIndex);
          modified = true;
        } else {
          startIndex++;
        }
      }
    }

    if (modified) {
      $done({ body: body });
    } else {
      $done({});
    }
  } else {
    // JSON handler
    try {
      if (body.trim().startsWith('{') || body.trim().startsWith('[')) {
        let obj = JSON.parse(body);

        function filterAds(o) {
          if (Array.isArray(o)) {
            let newArr = [];
            for (let item of o) {
              let result = filterAds(item);
              if (result !== null) newArr.push(result);
            }
            return newArr;
          } else if (o !== null && typeof o === 'object') {
            const isAd = (
              o.isPromoted === true ||
              o.is_promoted === true ||
              o.isAd === true ||
              o.is_ad === true ||
              o.adPayload ||
              o.ad_payload ||
              o.promotedMetadata ||
              o.promoted_metadata ||
              o.adMetadata ||
              o.ad_metadata ||
              o.campaignId ||
              o.campaign_id ||
              o.impressionId ||
              o.impression_id ||
              o.adEvents ||
              o.ad_events ||
              o.promoted_info ||
              o.ad_info ||
              o.shreddit_comments_page_ad ||
              o.__typename === 'AdPost' ||
              o.__typename === 'AdMetadataCell' ||
              o.__typename === 'PromotedPost' ||
              o.__typename === 'CommentAd' ||
              o.__typename === 'AdContent'
            );

            if (isAd) return null;

            // Unlock NSFW
            if (o.isNsfw === true) o.isNsfw = false;
            if (o.isNsfwMediaBlocked === true) o.isNsfwMediaBlocked = false;
            if (o.isNsfwContentShown === false) o.isNsfwContentShown = true;

            // Remove comment ads container
            if (Array.isArray(o.commentsPageAds)) o.commentsPageAds = [];

            for (let k in o) {
              if (Object.prototype.hasOwnProperty.call(o, k)) {
                o[k] = filterAds(o[k]);
              }
            }
          }
          return o;
        }

        let startObjStr = JSON.stringify(obj).length;
        obj = filterAds(obj);
        let endObjStr = JSON.stringify(obj).length;

        if (startObjStr !== endObjStr) {
          $done({ body: JSON.stringify(obj) });
        } else {
          $done({});
        }
      } else {
        $done({});
      }
    } catch (e) {
      $done({});
    }
  }
} else {
  $done({});
}
