// apps/web/app/(clinical)/breast-us/page.tsx
"use client";

import { useState } from "react";
import {
  suggestBiradsCategory,
  evaluateVascularityPattern,
  evaluateElastographyScore,
} from "breast-classification";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { Label } from "@repo/ui/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Textarea } from "@repo/ui/components/ui/textarea";

export default function BreastUsPage() {
  // BI-RADS Suggestion
  const [biradsDescriptors, setBiradsDescriptors] = useState("");
  const [biradsResult, setBiradsResult] = useState<{ category: string; disclaimer: string } | null>(null);

  const handleBiradsSuggest = () => {
    try {
      const descriptors = JSON.parse(biradsDescriptors);
      setBiradsResult(suggestBiradsCategory(descriptors));
    } catch (e) {
      setBiradsResult({ category: "Ошибка", disclaimer: "Неверный формат JSON для дескрипторов." });
    }
  };

  // Vascularity Pattern
  const [vascularityPatternId, setVascularityPatternId] = useState("");
  const [vascularityResult, setVascularityResult] = useState<{
    text: string;
    suspicion: "low" | "medium" | "high" | "indeterminate";
  } | null>(null);

  const handleVascularityEvaluate = () => {
    setVascularityResult(evaluateVascularityPattern(vascularityPatternId));
  };

  // Elastography Score
  const [elastographyModalityId, setElastographyModalityId] = useState("");
  const [elastographyValue, setElastographyValue] = useState<number | string>("");
  const [elastographyThresholds, setElastographyThresholds] = useState("");
  const [elastographyResult, setElastographyResult] = useState<{
    text: string;
    suspicion: "low" | "medium" | "high" | "indeterminate";
    disclaimer: string;
  } | null>(null);

  const handleElastographyEvaluate = () => {
    try {
      const thresholds = elastographyThresholds ? JSON.parse(elastographyThresholds) : undefined;
      setElastographyResult(
        evaluateElastographyScore(elastographyModalityId, Number(elastographyValue), thresholds)
      );
    } catch (e) {
      setElastographyResult({
        text: "Ошибка",
        suspicion: "indeterminate",
        disclaimer: "Неверный формат JSON для пороговых значений.",
      });
    }
  };

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-3xl font-bold">Демонстрация Breast Ultrasound Classification</h1>

      {/* BI-RADS Suggestion */}
      <Card>
        <CardHeader>
          <CardTitle>Предложение категории BI-RADS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="birads-descriptors">Дескрипторы образования (JSON)</Label>
            <Textarea
              id="birads-descriptors"
              value={biradsDescriptors}
              onChange={(e) => setBiradsDescriptors(e.target.value)}
              placeholder='{"shape": "oval", "margin": "circumscribed"}'
              rows={5}
            />
          </div>
          <Button onClick={handleBiradsSuggest}>Предложить BI-RADS</Button>
          {biradsResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <p>
                <strong>Категория:</strong> {biradsResult.category}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Дисклеймер:</strong> {biradsResult.disclaimer}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vascularity Pattern */}
      <Card>
        <CardHeader>
          <CardTitle>Оценка паттерна васкуляризации</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="vascularity-pattern">Идентификатор паттерна</Label>
            <Input
              id="vascularity-pattern"
              value={vascularityPatternId}
              onChange={(e) => setVascularityPatternId(e.target.value)}
              placeholder="avascular, peripheral, central_or_mixed, chaotic, penetrating"
            />
          </div>
          <Button onClick={handleVascularityEvaluate}>Оценить васкуляризацию</Button>
          {vascularityResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <p>
                <strong>Текст:</strong> {vascularityResult.text}
              </p>
              <p>
                <strong>Подозрительность:</strong> {vascularityResult.suspicion}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Elastography Score */}
      <Card>
        <CardHeader>
          <CardTitle>Оценка эластографического показателя</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="elastography-modality">Модальность</Label>
            <Input
              id="elastography-modality"
              value={elastographyModalityId}
              onChange={(e) => setElastographyModalityId(e.target.value)}
              placeholder="strain_elastography, shear_wave_2d, arfi"
            />
          </div>
          <div>
            <Label htmlFor="elastography-value">Значение</Label>
            <Input
              id="elastography-value"
              type="number"
              value={elastographyValue}
              onChange={(e) => setElastographyValue(e.target.value)}
              placeholder="2.5"
            />
          </div>
          <div>
            <Label htmlFor="elastography-thresholds">Пороги (JSON, опционально)</Label>
            <Textarea
              id="elastography-thresholds"
              value={elastographyThresholds}
              onChange={(e) => setElastographyThresholds(e.target.value)}
              placeholder='{"strainRatio": {"benignUpper": 2.0, "suspiciousLower": 3.5}}'
              rows={5}
            />
          </div>
          <Button onClick={handleElastographyEvaluate}>Оценить эластографию</Button>
          {elastographyResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <p>
                <strong>Текст:</strong> {elastographyResult.text}
              </p>
              <p>
                <strong>Подозрительность:</strong> {elastographyResult.suspicion}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Дисклеймер:</strong> {elastographyResult.disclaimer}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
