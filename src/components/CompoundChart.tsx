import React, { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, {
  Circle,
  Line,
  Path,
  Text as SvgText,
} from 'react-native-svg';

import { WEEK_DOWN, WEEK_UP, WeekPoint } from '@/lib/compound';
import { colors, font } from '@/lib/theme';

/**
 * The wedge: in log space, +1%/day and −1%/day are two straight lines
 * diverging from today. Your actual trajectory threads between them —
 * toward the vision or toward the anti-vision.
 */
export function CompoundChart({
  points,
  color = colors.accentBright,
  height = 200,
}: {
  points: WeekPoint[];
  color?: string;
  height?: number;
}) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const H = height;
  const padL = 8;
  const padR = 66;
  const padT = 20;
  const midY = H / 2;
  const innerH = midY - padT;

  // Window: a few weeks beyond the data so the path has somewhere to go.
  const W = Math.max(10, points.length + 3);
  const vMax = W * Math.log(WEEK_UP);

  const xAt = (weekIdx: number) => padL + (weekIdx / W) * (width - padL - padR);
  const yAt = (logScore: number) => midY - (logScore / vMax) * innerH;

  const xEnd = xAt(W);
  const visionEndY = yAt(W * Math.log(WEEK_UP));
  const antiEndY = yAt(W * Math.log(WEEK_DOWN));

  // User path: origin (score 1) then one point per completed week.
  const coords = [
    { x: xAt(0), y: midY },
    ...points.map((p, i) => ({ x: xAt(i + 1), y: yAt(Math.log(p.score)) })),
  ];
  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const last = coords[coords.length - 1];
  const areaD = `${pathD} L${last.x.toFixed(1)},${midY} Z`;

  return (
    <View onLayout={onLayout} style={{ height: H }}>
      {width > 0 && (
        <Svg width={width} height={H}>
          {/* flat line: the myth that standing still is possible */}
          <Line
            x1={xAt(0)}
            y1={midY}
            x2={xEnd}
            y2={midY}
            stroke={colors.border}
            strokeWidth={1}
            strokeDasharray="2,5"
          />
          {/* vision: +1% a day */}
          <Line
            x1={xAt(0)}
            y1={midY}
            x2={xEnd}
            y2={visionEndY}
            stroke={colors.accentBright}
            strokeOpacity={0.5}
            strokeWidth={1.5}
          />
          {/* anti-vision: −1% a day */}
          <Line
            x1={xAt(0)}
            y1={midY}
            x2={xEnd}
            y2={antiEndY}
            stroke={colors.decay}
            strokeOpacity={0.5}
            strokeWidth={1.5}
          />
          <SvgText
            x={xEnd + 6}
            y={visionEndY + 4}
            fill={colors.accentBright}
            fontSize={10.5}
            fontFamily={font.sansMed}
          >
            +1% / day
          </SvgText>
          <SvgText
            x={xEnd + 6}
            y={antiEndY + 4}
            fill={colors.decay}
            fontSize={10.5}
            fontFamily={font.sansMed}
          >
            −1% / day
          </SvgText>

          {/* your actual trajectory */}
          {points.length > 0 && (
            <>
              <Path d={areaD} fill={color} fillOpacity={0.12} />
              <Path
                d={pathD}
                stroke={color}
                strokeWidth={2.5}
                fill="none"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <Circle cx={last.x} cy={last.y} r={8} fill={color} fillOpacity={0.22} />
              <Circle cx={last.x} cy={last.y} r={3.5} fill={color} />
            </>
          )}
          {points.length === 0 && <Circle cx={xAt(0)} cy={midY} r={3.5} fill={color} />}
        </Svg>
      )}
    </View>
  );
}
