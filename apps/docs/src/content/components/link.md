# Link

```tsx
<Link href="/orders/4417">PO-4417</Link>
<Link href="https://example.com" external>Supplier portal</Link>
```

An anchor with an href. Enter follows it; Space does not, because that is anchor behaviour and Clara
does not change what the platform already decided.

`external` announces that the link opens a new tab. A new tab that opens without warning takes the
back button away from the user, and the warning belongs in the accessible name rather than only in
an icon.
