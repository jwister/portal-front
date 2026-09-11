import type { NewApiPricingResponse } from '../../../api/portal'
export const pricingFixture: NewApiPricingResponse = {
  success: true, data: [
    { model_name: 'deepseek-test', vendor_id: 1, model_ratio: 0.15, completion_ratio: 2, cache_ratio: 0.1, create_cache_ratio: 1.25, enable_groups: ['default', 'premium'], supported_endpoint_types: ['openai'] },
    { model_name: 'image-test', model_type: 'image', model_price: 0.2, quota_type: 1, enable_groups: ['default'] },
    { model_name: 'seedance-test', billing_mode: 'tiered_expr', billing_expr: 'u("resolution") == "720p" ? tier("720p", u("duration") * 0.1) : tier("1080p", u("duration") * 0)', enable_groups: ['default'] },
    { model_name: 'cdance2.5-0807', model_ratio: 37.5, completion_ratio: 1, enable_groups: ['default'] },
  ], vendors: [{ id: 1, name: 'DeepSeek' }], group_ratio: { default: 0.95, premium: 1.5 }, usable_group: {}, supported_endpoint: { openai: { path: '/v1/chat/completions', method: 'POST' } }, auto_groups: [], pricing_version: 'test',
}


