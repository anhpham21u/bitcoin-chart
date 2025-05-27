import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch current price from Binance
    const currentResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
    const currentData = await currentResponse.json();
    const currentPrice = parseFloat(currentData.price);

    // Fetch 1-minute kline data to get price from 1 minute ago
    const klineResponse = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=2');
    const klineData = await klineResponse.json();
    
    // Get price from 1 minute ago (previous candle close)
    const previousPrice = klineData.length >= 2 ? parseFloat(klineData[0][4]) : currentPrice;
    const priceChange = currentPrice - previousPrice;

    return NextResponse.json({
      current: currentPrice,
      previous: previousPrice,
      change: priceChange,
      changePercent: previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0,
    });
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Bitcoin price' },
      { status: 500 }
    );
  }
} 