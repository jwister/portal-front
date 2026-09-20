import type { NewApiPricingResponse } from '../../../api/portal'
export const pricingFixture: NewApiPricingResponse = {
  success: true, data: [
    { model_name: 'deepseek-test', vendor_id: 1, model_ratio: 0.15, completion_ratio: 2, cache_ratio: 0.1, create_cache_ratio: 1.25, enable_groups: ['default', 'premium'], supported_endpoint_types: ['openai'] },
    { model_name: 'image-test', model_type: 'image', model_price: 0.2, quota_type: 1, enable_groups: ['default'] },
    { model_name: 'seedance-test', billing_mode: 'tiered_expr', billing_expr: 'u("resolution") == "720p" ? tier("720p", u("duration") * 0.1) : tier("1080p", u("duration") * 0)', enable_groups: ['default'] },
    { model_name: 'cdance2.5-0807', model_ratio: 37.5, completion_ratio: 1, enable_groups: ['default'] },
    // Copied verbatim from the live catalog: weekends, public holidays, the days swapped to
    // work around them, and the night window all select the cheap band — which the gateway
    // writes *first*, so this is also what stops the page quoting the off-peak rate.
    { model_name: 'deepseek-v4.1-flash', vendor_id: 1, model_ratio: 37.5, completion_ratio: 1, billing_mode: 'tiered_expr', enable_groups: ['default'], supported_endpoint_types: ['openai'], billing_expr: '(( (weekday("Asia/Shanghai") == 0 || weekday("Asia/Shanghai") == 6) && !( (month("Asia/Shanghai") == 1 && day("Asia/Shanghai") == 4) || (month("Asia/Shanghai") == 2 && (day("Asia/Shanghai") == 14 || day("Asia/Shanghai") == 28)) || (month("Asia/Shanghai") == 5 && day("Asia/Shanghai") == 9) || (month("Asia/Shanghai") == 9 && day("Asia/Shanghai") == 20) || (month("Asia/Shanghai") == 10 && day("Asia/Shanghai") == 10) ) ) || (month("Asia/Shanghai") == 1 && day("Asia/Shanghai") >= 1 && day("Asia/Shanghai") <= 3) || (hour("Asia/Shanghai") >= 22 || hour("Asia/Shanghai") < 8)) ? tier("off_peak", p * 0.1493 + c * 0.597 + cr * 0.002985) : tier("peak", p * 0.2985 + c * 1.194 + cr * 0.00597)' },
    // The other kind of tier, also live: bands picked by how long the input is.
    { model_name: 'deepseek-banded-test', vendor_id: 1, model_ratio: 37.5, completion_ratio: 1, billing_mode: 'tiered_expr', enable_groups: ['default'], supported_endpoint_types: ['openai'], billing_expr: 'len <= 32000 ? tier("输入<=32k", p * 0.8955 + c * 3.5821 + cr * 0.194) : tier("32k<输入<=200k", p * 1.194 + c * 4.1791 + cr * 0.2985)' },
  ], vendors: [{ id: 1, name: 'DeepSeek' }], group_ratio: { default: 0.95, premium: 1.5 }, usable_group: {}, supported_endpoint: { openai: { path: '/v1/chat/completions', method: 'POST' } }, auto_groups: [], pricing_version: 'test',
}


