# Conversion Tracking

Car Match sends conversion events through `src/lib/analytics.ts`.

Each event is sent to:

- `window.gtag('event', eventName, params)` for GA4.
- `window.dataLayer.push({ event: eventName, ...params })` for GTM.
- `window.dispatchEvent(new CustomEvent('carmatch:analytics', { detail }))` for browser debugging.

## Recommended GA4 Key Events

Mark these as key events in GA4:

| Event | Meaning |
| --- | --- |
| `cm_booking_submit_success` | Customer created an online booking successfully. |
| `cm_lead_submit_success` | Customer submitted a lead form successfully. |
| `cm_zalo_click` | Customer clicked a Zalo contact CTA. |
| `cm_phone_click` | Customer clicked a phone contact CTA. |

## Supporting Events

Use these for funnel analysis, not primary conversion counting:

| Event | Meaning |
| --- | --- |
| `cm_cta_click` | Generic CTA click. Check `cta` param. |
| `cm_vehicle_click` | Vehicle card/detail click. Check `source`, `action`, `vehicle_slug`. |
| `cm_booking_submit_attempt` | Booking form submit started. |
| `cm_booking_submit_error` | Booking form submit failed. |
| `cm_lead_submit_attempt` | Lead form submit started. |
| `cm_lead_submit_error` | Lead form submit failed. |
| `blog_conversion_click` | Blog CTA click. |

## Important Params

| Param | Meaning |
| --- | --- |
| `page_path` | Current URL path. |
| `page_location` | Full current URL. |
| `source` | CTA placement, for example `navbar_desktop`, `home_hero`, `booking_widget_contact`. |
| `cta` | CTA name for `cm_cta_click`. |
| `vehicle_id` | Vehicle id from API/Supabase. |
| `vehicle_slug` | Public vehicle slug. |
| `vehicle_name` | Public vehicle name. |
| `total_amount` | Booking estimated total amount. |
| `booking_ref` | Booking reference after successful submit. |
| `lead_source` | Lead source, for example `b2b`, `partner`, `trip_finder`. |
| `form_type` | Lead form type. |
| `error_message` | Error detail for failed submit events. |

## Debug In Browser

Open DevTools Console and run:

```js
window.addEventListener('carmatch:analytics', (event) => console.log(event.detail));
```

Then click a CTA or submit a test form. The event payload should be printed immediately.
