import { CandlestickData, RSIData, MACDData } from '@/types/chart';

// Calculate RSI (Relative Strength Index)
export function calculateRSI(data: CandlestickData[], period: number = 14): RSIData[] {
  if (data.length < period + 1) return [];

  const rsiData: RSIData[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  // Calculate initial gains and losses
  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  // Calculate RSI for each point
  for (let i = period - 1; i < gains.length; i++) {
    const avgGain = gains.slice(i - period + 1, i + 1).reduce((sum, gain) => sum + gain, 0) / period;
    const avgLoss = losses.slice(i - period + 1, i + 1).reduce((sum, loss) => sum + loss, 0) / period;
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    rsiData.push({
      time: data[i + 1].time,
      value: rsi
    });
  }

  return rsiData;
}

// Calculate MACD (Moving Average Convergence Divergence)
export function calculateMACD(
  data: CandlestickData[], 
  fastPeriod: number = 12, 
  slowPeriod: number = 26, 
  signalPeriod: number = 9
): MACDData[] {
  if (data.length < slowPeriod) return [];

  const macdData: MACDData[] = [];
  
  // Calculate EMAs
  const fastEMA = calculateEMA(data.map(d => d.close), fastPeriod);
  const slowEMA = calculateEMA(data.map(d => d.close), slowPeriod);
  
  // Calculate MACD line
  const macdLine: number[] = [];
  for (let i = slowPeriod - 1; i < fastEMA.length; i++) {
    macdLine.push(fastEMA[i] - slowEMA[i - (fastPeriod - slowPeriod)]);
  }
  
  // Calculate Signal line (EMA of MACD line)
  const signalLine = calculateEMA(macdLine, signalPeriod);
  
  // Calculate Histogram and create final data
  for (let i = signalPeriod - 1; i < macdLine.length; i++) {
    const histogram = macdLine[i] - signalLine[i - (signalPeriod - 1)];
    
    macdData.push({
      time: data[i + slowPeriod - 1].time,
      macd: macdLine[i],
      signal: signalLine[i - (signalPeriod - 1)],
      histogram: histogram
    });
  }

  return macdData;
}

// Calculate Exponential Moving Average
function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA is just the average of first 'period' prices
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  ema[period - 1] = sum / period;
  
  // Calculate subsequent EMAs
  for (let i = period; i < prices.length; i++) {
    ema[i] = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
  }
  
  return ema;
}

// Calculate Simple Moving Average
export function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((acc, price) => acc + price, 0);
    sma.push(sum / period);
  }
  
  return sma;
} 