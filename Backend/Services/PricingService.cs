namespace LifeEventsHub.Api.Services;

public class DisplayOption
{
    public int Days { get; init; }
    public decimal Price { get; init; }
    public string Label { get; init; } = string.Empty;
}

public class PricingService
{
    private static readonly DisplayOption[] Options =
    {
        new() { Days = 1, Price = 0.99m, Label = "1 day" },
        new() { Days = 3, Price = 1.99m, Label = "3 days" },
        new() { Days = 7, Price = 2.99m, Label = "7 days" },
        new() { Days = 14, Price = 4.99m, Label = "14 days" },
        new() { Days = 30, Price = 7.99m, Label = "30 days" },
        new() { Days = 90, Price = 14.99m, Label = "90 days" }
    };

    public IReadOnlyList<DisplayOption> GetDisplayOptions() => Options;

    public DisplayOption? GetOption(int days) => Options.FirstOrDefault(o => o.Days == days);

    public decimal GetPrice(int days) => GetOption(days)?.Price ?? 0;
}
