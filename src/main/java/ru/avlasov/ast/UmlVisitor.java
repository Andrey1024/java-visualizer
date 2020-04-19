package ru.avlasov.ast;

import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.*;
import com.github.javaparser.ast.visitor.VoidVisitorAdapter;
import com.github.javaparser.resolution.declarations.ResolvedEnumDeclaration;
import com.github.javaparser.resolution.declarations.ResolvedReferenceTypeDeclaration;
import org.eclipse.uml2.uml.*;
import org.eclipse.uml2.uml.Class;
import org.eclipse.uml2.uml.Package;

import java.util.List;

public class UmlVisitor {
    private Model model;

    public UmlVisitor( Model model) {
        this.model = model;
    }

    public void ParseToModel(CompilationUnit cu) {
            getClasses(cu);
            getEnums(cu);
    }

    public Model getModel() {
        return model;
    }

    private Package getParentPackage(String packageName) {
        Package thePackage = model;
        String[] names = packageName.split("\\.");
        for (int i = 0; i < names.length; ++i) {
            Package nestedPackage = thePackage.getNestedPackage(names[i]);
            if (nestedPackage == null) {
                nestedPackage = thePackage.createNestedPackage(names[i]);
            }
            thePackage = nestedPackage;
        }
        return thePackage;
    }

    private void getClasses(CompilationUnit cu) {

        new VoidVisitorAdapter<Object>() {
            @Override
            public void visit(ClassOrInterfaceDeclaration n, Object arg) {
                ResolvedReferenceTypeDeclaration type = n.resolve();
                if (type.getPackageName().isEmpty()) return;
                Package thePackage = getParentPackage(type.getPackageName());

                if (type.isInterface()) {
                    Interface ownedInterface = thePackage.createOwnedInterface(type.getName());
                    setFields(n, ownedInterface);
                    setMethods(n, ownedInterface);
                } else if (type.isClass()) {
                    Class clazz = thePackage.createOwnedClass(type.getClassName(), false);
                    setFields(n, clazz);
                    setMethods(n, clazz);
                }


                super.visit(n, arg);
            }
        }.visit(cu, null);
    }

    private void setFields(ClassOrInterfaceDeclaration clazz, AttributeOwner attributeOwner) {
        new VoidVisitorAdapter<Object>() {
            @Override
            public void visit(FieldDeclaration n, Object arg) {
                for (VariableDeclarator v : n.getVariables()) {
                    attributeOwner.createOwnedAttribute(v.getNameAsString(), model.getOwnedType(v.getTypeAsString()));
                }
            }
        }.visit(clazz, null);
    }

    private void setMethods(ClassOrInterfaceDeclaration clazz, OperationOwner operationOwner) {
        new VoidVisitorAdapter<Object>() {
            @Override
            public void visit(MethodDeclaration n, Object arg) {
                operationOwner.createOwnedOperation(n.getNameAsString(), null, null);
            }
        }.visit(clazz, null);
    }

    private void getEnums(CompilationUnit cu) {
        new VoidVisitorAdapter<Object>() {
            @Override
            public void visit(EnumDeclaration n, Object arg) {
                ResolvedEnumDeclaration type = n.resolve();
                Package parentPackage = getParentPackage(type.getPackageName());

                parentPackage.createOwnedEnumeration(type.getName());
            }
        }.visit(cu, null);
    }
}