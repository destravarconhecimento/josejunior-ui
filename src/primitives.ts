/**
 * Primitivos de layout do design-system. Os apps importam daqui, nunca do Chakra.
 *
 * IMPORTANTE: usamos `import ... as C` + `export const X = C` (atribuição local),
 * NÃO `export { X } from "@chakra-ui/react"` (re-export de binding). O re-export
 * direto faz o Turbopack tratar o @chakra-ui como barrel e quebra o tree-shaking
 * da anatomy do @ark-ui no build (`accordionAnatomy.extendWith is not a function`).
 * A atribuição local conta como USO do módulo e evita isso, preservando 100% os
 * tipos (X === o componente do Chakra). NÃO colocar `"use client"` (RSC-safe).
 */
import {
  Box as CBox,
  Flex as CFlex,
  Stack as CStack,
  HStack as CHStack,
  VStack as CVStack,
  Grid as CGrid,
  GridItem as CGridItem,
  SimpleGrid as CSimpleGrid,
  Container as CContainer,
  Center as CCenter,
  Wrap as CWrap,
  WrapItem as CWrapItem,
  Spacer as CSpacer,
  Text as CText,
  Heading as CHeading,
  Span as CSpan,
  Image as CImage,
  AspectRatio as CAspectRatio,
  Spinner as CSpinner,
  Separator as CSeparator,
  VisuallyHidden as CVisuallyHidden,
} from "@chakra-ui/react";

export const Box = CBox;
export const Flex = CFlex;
export const Stack = CStack;
export const HStack = CHStack;
export const VStack = CVStack;
export const Grid = CGrid;
export const GridItem = CGridItem;
export const SimpleGrid = CSimpleGrid;
export const Container = CContainer;
export const Center = CCenter;
export const Wrap = CWrap;
export const WrapItem = CWrapItem;
export const Spacer = CSpacer;
export const Text = CText;
export const Heading = CHeading;
export const Span = CSpan;
export const Image = CImage;
export const AspectRatio = CAspectRatio;
export const Spinner = CSpinner;
export const Separator = CSeparator;
export const VisuallyHidden = CVisuallyHidden;

export type {
  BoxProps,
  FlexProps,
  StackProps,
  GridProps,
  GridItemProps,
  SimpleGridProps,
  ContainerProps,
  TextProps,
  HeadingProps,
  ImageProps,
  SpinnerProps,
} from "@chakra-ui/react";
