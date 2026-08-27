# Skeleton

```tsx
<SkeletonGroup label="Loading invoices">
  <Skeleton />
  <Skeleton width="three-quarters" />
  <Skeleton width="half" />
</SkeletonGroup>
```

Loading placeholders, and the container that announces for them.

Every `Skeleton` is `aria-hidden` and there is no way to override it. A loading list renders forty
of these, and forty announcements is the defect the component exists to prevent, so the API does
not offer the prop that would cause it. `SkeletonGroup` announces once, for the whole group.

`width` is a closed set (`full`, `three-quarters`, `half`, `quarter`) rather than a CSS length. A
ragged edge is the effect you want, and four steps produce it.

## Skeletons do not shimmer

No shimmer, no pulse, no sweep, in either motion preference. A skeleton's information is its shape:
content is coming, and it will be about this big. A shimmer adds nothing that shape has not already
said, and forty shimmering blocks is a crowded screen in the time dimension.

If you want to say "still working" rather than "content is coming", that is a `Spinner`, and the
distinction is real: a spinner states liveness, a skeleton states structure.

## Say when it arrives

Neither component announces when the placeholders are replaced by real content, and that is the
moment your user is actually waiting for. That belongs to whatever does the swap. It is the easiest
part of a loading state to forget.
