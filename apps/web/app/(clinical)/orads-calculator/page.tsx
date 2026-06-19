// apps/web/app/(clinical)/orads-calculator/page.tsx
"use client";

import { useState } from "react";
import { ORADS_DECISION_TREE, ORADS_TREE_ROOT_ID, ORADS_TREE_OPTIONAL_ENTRY_ID, getOradsDecisionNode } from "@repo/orads-us/oradsDecisionTree";
import { calculateOradsResult, UserAnswers } from "@repo/orads-us/calculateOradsResult";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { Label } from "@repo/ui/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/ui/radio-group";
import { Separator } from "@repo/ui/components/ui/separator";
import { getOradsImage } from "../../../lib/orads-images";
import { OradsDecisionNode, OradsDecisionOption } from "@repo/orads-us/types";

export default function OradsCalculatorPage() {
  const [currentPath, setCurrentPath] = useState<UserAnswers>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string>(ORADS_TREE_ROOT_ID);
  const [result, setResult] = useState<any>(null); // OradsResult

  const currentNode = getOradsDecisionNode(currentNodeId);

  const handleOptionSelect = (optionId: string) => {
    if (!currentNode) return;

    const newPath = [...currentPath, { nodeId: currentNodeId, optionId }];
    setCurrentPath(newPath);

    const selectedOption = currentNode.options.find((opt) => opt.id === optionId);

    if (selectedOption?.next) {
      setCurrentNodeId(selectedOption.next);
      setResult(null);
    } else if (selectedOption?.result) {
      const finalResult = calculateOradsResult(newPath);
      setResult(finalResult);
    } else {
      // Handle cases where an option doesn't lead to a new node or a final result yet
      setResult({ ok: false, error: "Invalid path or incomplete logic" });
    }
  };

  const handleReset = () => {
    setCurrentPath([]);
    setCurrentNodeId(ORADS_TREE_ROOT_ID);
    setResult(null);
  };

  const handleBack = () => {
    if (currentPath.length > 0) {
      const previousStep = currentPath[currentPath.length - 1];
      const newPath = currentPath.slice(0, currentPath.length - 1);
      setCurrentPath(newPath);
      setCurrentNodeId(previousStep.nodeId); 
      setResult(null);
    } else {
      handleReset();
    }
  };

  if (!currentNode) {
    return (
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-4">O-RADS Калькулятор</h1>
        <p>Ошибка: Не удалось найти узел дерева решений.</p>
        <Button onClick={handleReset} className="mt-4">Начать заново</Button>
      </div>
    );
  }

  // Placeholder for i18n - in a real app, these would come from a localization system
  const getQuestionText = (key: string) => key; // Simplified
  const getOptionLabel = (key: string) => key; // Simplified

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">O-RADS US Калькулятор</h1>

      {/* Breadcrumbs */}
      <div className="mb-4 text-sm text-muted-foreground">
        Главная {currentPath.map((step, index) => {
          const node = getOradsDecisionNode(step.nodeId);
          const option = node?.options.find(opt => opt.id === step.optionId);
          return (
            <span key={index}> &gt; {getQuestionText(node?.questionKey || '')} ({getOptionLabel(option?.labelKey || '')})</span>
          );
        })}
      </div>
      <Separator className="mb-6" />

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">{getQuestionText(currentNode.questionKey)}</CardTitle>
          {currentNode.helpKey && (
            <p className="text-sm text-muted-foreground">{getQuestionText(currentNode.helpKey)}</p>
          )}
        </CardHeader>
        <CardContent>
          {currentNode.imageRef && (
            <div className="mb-4 flex justify-center">
              <img
                src={getOradsImage(currentNode.imageRef) || "/placeholder.png"}
                alt={currentNode.imageRef}
                className="max-w-full h-auto rounded-md shadow-md"
              />
            </div>
          )}

          <RadioGroup onValueChange={handleOptionSelect} value="">
            {currentNode.options.map((option) => (
              <div key={option.id} className="flex items-center space-x-2 my-2">
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id}>{getOptionLabel(option.labelKey)}</Label>
                {option.imageRef && (
                  <img
                    src={getOradsImage(option.imageRef) || "/placeholder.png"}
                    alt={option.imageRef}
                    className="w-16 h-16 object-cover rounded-sm ml-2"
                  />
                )}
              </div>
            ))}
          </RadioGroup>

          <div className="flex justify-between mt-6">
            <Button onClick={handleBack} disabled={currentPath.length === 0} variant="outline">
              Назад
            </Button>
            <Button onClick={handleReset} variant="destructive">
              Начать заново
            </Button>
          </div>

          {result && (
            <div className="mt-8 p-4 border rounded-md bg-accent/20">
              <h2 className="text-xl font-semibold mb-2">Результат O-RADS:</h2>
              {result.ok ? (
                <div>
                  <p>Категория: <strong>{result.result.category}</strong></p>
                  <p>Номер категории: {result.result.categoryNumber}</p>
                  <p>Риск малигнизации: {result.result.riskPercent}</p>
                  <p>Менеджмент: {getQuestionText(result.result.managementKey)}</p>
                  {result.result.rationaleKey && (
                    <p className="text-sm text-muted-foreground">
                      Обоснование: {getQuestionText(result.result.rationaleKey)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-red-500">Ошибка при расчете: {result.error}</p>
              )}
              <Button onClick={handleReset} className="mt-4">Начать новый расчет</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 text-sm text-muted-foreground text-center">
        <p>Разработано на основе ACR O-RADS US v2022.</p>
        <p>Этот калькулятор предназначен только для справочных целей и не является медицинским советом.</p>
      </div>
    </div>
  );
}
