using Stripe;
using Stripe.Checkout;

namespace LifeEventsHub.Api.Services;

public class StripeService
{
    private readonly string? _secretKey;
    private readonly string? _webhookSecret;
    private readonly string _frontendBaseUrl;

    public StripeService(IConfiguration config)
    {
        _secretKey = config["Stripe:SecretKey"];
        _webhookSecret = config["Stripe:WebhookSecret"];
        _frontendBaseUrl = config["Frontend:BaseUrl"] ?? "http://localhost:4200";
        if (!string.IsNullOrEmpty(_secretKey))
            StripeConfiguration.ApiKey = _secretKey;
    }

    public bool IsConfigured => !string.IsNullOrEmpty(_secretKey);

    public async Task<Session> CreateCheckoutSessionAsync(int draftId, decimal amountUsd, string label, string? customerEmail, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(_secretKey))
            throw new InvalidOperationException("Stripe is not configured. Set Stripe:SecretKey in appsettings.");

        var options = new SessionCreateOptions
        {
            PaymentMethodTypes = new List<string> { "card" },
            LineItems = new List<SessionLineItemOptions>
            {
                new()
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = "usd",
                        UnitAmountDecimal = amountUsd * 100, // Stripe expects cents
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = $"Event display - {label}",
                            Description = $"Your event will be visible for {label}."
                        }
                    },
                    Quantity = 1
                }
            },
            Mode = "payment",
            SuccessUrl = $"{_frontendBaseUrl}/create-event/success?session_id={{CHECKOUT_SESSION_ID}}",
            CancelUrl = $"{_frontendBaseUrl}/create-event/payment/{draftId}",
            Metadata = new Dictionary<string, string> { { "draftId", draftId.ToString() } },
            ClientReferenceId = draftId.ToString()
        };
        if (!string.IsNullOrEmpty(customerEmail))
            options.CustomerEmail = customerEmail;

        var service = new SessionService();
        return await service.CreateAsync(options, cancellationToken: ct);
    }

    public async Task<Session?> GetSessionAsync(string sessionId, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(_secretKey))
            return null;
        try
        {
            var service = new SessionService();
            return await service.GetAsync(sessionId, cancellationToken: ct);
        }
        catch { return null; }
    }

    public Stripe.Event? ConstructWebhookEvent(string json, string signature)
    {
        if (string.IsNullOrEmpty(_webhookSecret))
            return null;
        try
        {
            return EventUtility.ConstructEvent(json, signature, _webhookSecret);
        }
        catch { return null; }
    }
}
