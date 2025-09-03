"use client";

import React from "react";
import { Button, Heading, Paragraph } from "@/components/ui";
import type { Dish } from "./types";

/** Singola card di piatto nella lista selezionabile. */
export default function DishCard({
  dish,
  categoryLabel,
  onPick,
}: {
  dish: Dish;
  categoryLabel: string;
  onPick: (dish: Dish) => void;
}) {
  return (
    <li className="rounded-2xl border border-[#C7AE6A33] bg-neutral-900/50 p-4 hover:border-[#C7AE6A] transition">
      <div className="flex flex-col gap-1">
        <Heading level="h4" className="font-semibold line-clamp-2">
          {dish.nomePiatto}
        </Heading>
        <div>
          <span className="inline-block rounded-full bg-[#C7AE6A33] px-2 py-1 text-xs text-[#C7AE6A]">
            {categoryLabel}
          </span>
        </div>
        <hr className="text-[#C7AE6A33] my-1" />
      </div>

      {dish.descrizione && (
        <Paragraph size="sm" className="mt-1 line-clamp-3">
          {dish.descrizione}
        </Paragraph>
      )}

      <div className="mt-3 flex justify-end">
        <Button
          size="md"
          variant="secondary"
          className="h-9 px-3"
          onClick={() => onPick(dish)}
        >
          Seleziona
        </Button>
      </div>
    </li>
  );
}
