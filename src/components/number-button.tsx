"use client";

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NumberButtonProps {
  number: number;
  onClick: (num: number) => void;
  disabled: boolean;
  isSelected: boolean;
  countInSelection: number;
}

export const NumberButton: FC<NumberButtonProps> = ({
  number,
  onClick,
  disabled,
  isSelected, // Not directly used for styling now, but could be
  countInSelection,
}) => {
  return (
    <Button
      variant={countInSelection > 0 ? "default" : "outline"}
      className={cn(
        "relative aspect-square h-auto text-lg font-semibold p-0",
        "shadow-md hover:shadow-lg transition-shadow",
        countInSelection > 0 && "bg-primary text-primary-foreground hover:bg-primary/90",
        countInSelection === 0 && "bg-card hover:bg-secondary hover:text-secondary-foreground",
        disabled && countInSelection === 0 && "opacity-50 cursor-not-allowed bg-muted",
        disabled && countInSelection > 0 && "opacity-70 cursor-not-allowed" 
      )}
      onClick={() => onClick(number)}
      disabled={disabled}
      aria-pressed={countInSelection > 0}
      aria-label={`Selecionar número ${number}${countInSelection > 0 ? `, selecionado ${countInSelection} vezes` : ''}`}
    >
      {number}
      {countInSelection > 0 && (
        <span
          className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center_leading-none"
          aria-label={`${countInSelection} vezes selecionado`}
        >
          {countInSelection}x
        </span>
      )}
    </Button>
  );
};
