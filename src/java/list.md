---
title: List
---

:::warning
源代码基于JDK17
:::

## Vector
### 源码分析

```java
/**
 * 1.Vector 是线程安全的集合,多线程操作性能不高
 * 2.推荐使用JUC集合
 */
public class Vector<E>
        extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable {
    
    //用于存储集合中所有的数据对象
    protected Object[] elementData;

    //当前存储的数据数量
    protected int elementCount;

    /**
     * 1.表示每次扩容的大小,如果初始化时不进行设置,默认0,扩容时集合容量变为原容量的2倍
     * 2.如果初始化指定大小,例如20,每次扩容都是oldSize+20
     */
    protected int capacityIncrement;


    //指定集合大小以及扩容参数大小
    public Vector(int initialCapacity, int capacityIncrement) {
        super();
        if (initialCapacity < 0)
            throw new IllegalArgumentException("Illegal Capacity: " +
                    initialCapacity);
        //初始化赋值给创建的数组
        this.elementData = new Object[initialCapacity];
        //如果没有设置capacityIncrement,默认0,扩容规则 例如原始数组大小为10，扩容到20，为原数组大小的2倍
        this.capacityIncrement = capacityIncrement;
    }

    //指定集合大小
    public Vector(int initialCapacity) {
        this(initialCapacity, 0);
    }

    //使用无参构造器，默认初始化的数组大小为10的集合
    public Vector() {
        this(10);
    }
    
    public Vector(Collection<? extends E> c) {
        Object[] a = c.toArray();
        elementCount = a.length;
        if (c.getClass() == ArrayList.class) {
            elementData = a;
        } else {
            elementData = Arrays.copyOf(a, elementCount, Object[].class);
        }
    }

    /**
     * add方法触发扩容机制过程
     * 1.如果elementCount的当前值小于elementData.length的值时,不会触发扩容操作,直接在elementData[s] 索引处添加新的数据对象即可
     * 2.如果elementCount的当前值等于elementData.length的值时,就会触发扩容操作,需要调用grow()方法，申请新的扩容空间后,
     *   再执行elementData[s] 索引处添加新的数据对象即可
     */
    private void add(E e, Object[] elementData, int s) {
        if (s == elementData.length)
            elementData = grow();
        elementData[s] = e;
        elementCount = s + 1;
    }

    //setSize 触发扩容机制
    public synchronized void setSize(int newSize) {
        modCount++;
        // 如果新容量大于当前数组长度 就进行扩容操作
        if (newSize > elementData.length)
            grow(newSize);
        final Object[] es = elementData;
        // 如果新的容量小于当前数据长度 将之后的索引位置上的数据对象设置为null
        for (int to = elementCount, i = newSize; i < to; i++)
            es[i] = null;
        elementCount = newSize;
    }

    // 可以进行缩容操作
    public synchronized void trimToSize() {
        modCount++;
        int oldCapacity = elementData.length;
        // 进行缩容操作时，判断如果当前实际存储数据数量 小于 数组长度 进行缩容，反之不进行任何操作
        if (elementCount < oldCapacity) {
            elementData = Arrays.copyOf(elementData, elementCount);
        }
    }

    //具体扩容操作 最后把旧数据复制到新的扩容数组，然后赋值给 elementData 完成扩容操作
    private Object[] grow(int minCapacity) {
        int oldCapacity = elementData.length;
        int newCapacity = ArraysSupport.newLength(oldCapacity,
                minCapacity - oldCapacity, /* minimum growth */
                capacityIncrement > 0 ? capacityIncrement : oldCapacity
                /* preferred growth */);
        return elementData = Arrays.copyOf(elementData, newCapacity);
    }

}
```
### 初始化以及扩容总结
#### 1.使用无参构造器
:::warning
- 无参构造器初始化Vector,elementData.length默认为10,capacityIncrement默认为0
- 当elementCount = 10,触发扩容操作,调用grow方法
- 因为capacityIncrement不大于0,即preferred growth为elementData.length,扩容为elementData.length的2倍
- 扩容规律为 10 -> 20 -> 40
:::
#### 2.不使用无参构造器
:::warning
- 指定capacityIncrement,例如指定capacityIncrement=20,initialCapacity=20
- 当elementCount = 20时触发扩容,调用grow方法
- 因为capacityIncrement大于0,即preferred growth = 20
- 扩容规律为 40 -> 60 -> 80,每次扩容都按照capacityIncrement的数值进行增量扩容
:::
## ArrayList
### 源码分析
```java
// ArrayList 非线程安全集合
public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable
{
    
    //默认初始化容量，在使用无参构造器创建ArrayList时
    private static final int DEFAULT_CAPACITY = 10;

    //使用有参构造器并且initialCapacity=0时，赋值给 elementData 
    private static final Object[]  EMPTY_ELEMENTDATA = {};

    //使用无参构造器,赋值给 elementData
    private static final Object[] DEFAULTCAPACITY_EMPTY_ELEMENTDATA = {};

    //用于存储数据的数组,transient修饰,自定义序列化
    transient Object[] elementData;

    //当前实际数据大小  
    private int size;

    //创建一个指定initialCapacity大小的数组,如果initialCapacity=0,相当于无参构造器创建一样
    public ArrayList(int initialCapacity) {
        if (initialCapacity > 0) {
            this.elementData = new Object[initialCapacity];
        } else if (initialCapacity == 0) {
            this.elementData = EMPTY_ELEMENTDATA;
        // 不支持initialCapacity为0     
        } else {
            throw new IllegalArgumentException("Illegal Capacity: "+
                    initialCapacity);
        }
    }
    //创建一个空数组,在第一次add添加数据的时候才会创建一个默认大小为10的数组
    public ArrayList() {
        this.elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA;
    }

    public ArrayList(Collection<? extends E> c) {
        Object[] a = c.toArray();
        if ((size = a.length) != 0) {
            if (c.getClass() == ArrayList.class) {
                elementData = a;
            } else {
                elementData = Arrays.copyOf(a, size, Object[].class);
            }
        } else {
            // replace with empty array.  
            elementData = EMPTY_ELEMENTDATA;
        }
    }
    //支持缩容
    public void trimToSize() {
        modCount++;
        if (size < elementData.length) {
            elementData = (size == 0)
                    ? EMPTY_ELEMENTDATA
                    : Arrays.copyOf(elementData, size);
        }
    }

    private void add(E e, Object[] elementData, int s) {
        if (s == elementData.length)
            elementData = grow();
        elementData[s] = e;
        size = s + 1;
    }
    // minCapacity = size + 1 
    private Object[] grow(int minCapacity) {
        int oldCapacity = elementData.length;
        if (oldCapacity > 0 || elementData != DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
            int newCapacity = ArraysSupport.newLength(oldCapacity,
                    minCapacity - oldCapacity, /* minimum growth */
                    oldCapacity >> 1           /* preferred growth */);
            return elementData = Arrays.copyOf(elementData, newCapacity);
        } else {
            return elementData = new Object[Math.max(DEFAULT_CAPACITY, minCapacity)];
        }
    }
}
```
### 初始化以及扩容总结
#### 1.使用无参构造器
:::warning
- 初始化一个容量为0的数组,即elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA
- 当后续第一次执行添加操作会立即执行扩容操作调用grow方法,初始化一个默认为10的ArrayList集合
- 后续当s == 10,也就是说默认长度为10的数组已经满数据,会进一步进行扩容
- 满足条件oldCapacity > 0,执行扩容逻辑 oldCapacity >> 1 也就是 10/2,旧容量10 新容量15,相当于扩容为原数组大小的1.5倍
:::
#### 2.不使用无参构造器
:::warning
- 会初始化一个容量为initialCapacity的数组
- 如果initialCapacity=0,执行步骤相当于无参构造器的初始化扩容
- 如果initialCapacity>0,会初始化一个容量为initialCapacity的数组,这时候第一次执行添加操作不会立即扩容操作
- 当s == elementData.length触发扩容,如果指定初始化ArrayList大小,相当于比无参构造器少一次立即初始化的步骤 
:::

## Vector与ArrayList对比
|      | Vector                                                 | ArrayList                                               |
|:-----|:-------------------------------------------------------|:--------------------------------------------------------|
| 内部结构 | 基于数组，初始化容量值默认10，使用者可以指定容量                              | 基于数组，默认初始化为0的空数组，第一次添加数据，会扩容到10，使用者也可以自定义初始化的值          |
| 扩容机制 | 默认扩容按照原数组的2倍进行扩容，可以指定扩容大小，即如果指定为20则每次扩容都按照原数组大小+20进行扩容 | 扩容按照原数组的1.5倍进行扩容,使用者不能干预扩容逻辑,除非扩容前容量小于10                |
| 线程安全 | 线程安全                                                   | 线程不安全                                                   |
| 序列化  | 没有对集合序列化做特殊优化处理,elementData多余的索引位会一起被序列化,造成不必要的性能消耗    | 对elementData序列化做了特殊处理,只对索引位有数据的进行序列化处理,未被使用的索引位,不做序列化操作 |

## Stack
### 源码分析
```java
/*
 * 1.LIFO栈结构，extend Vector，扩容规则同Vector，也不会对序列化和反序列化进行优化处理
 * 2.Stack 集合内部结构仍然是一个数组，使用数组的尾部模拟栈结构的栈顶，使用数组的头部模拟栈结构的栈底
 * 3.不推荐使用，如果需要栈结构，建议使用ArrayDeque
 */
public class Stack<E> extends Vector<E> {
    
    public Stack() {
    }

  
    public E push(E item) {
        addElement(item);

        return item;
    }

   
    public synchronized E pop() {
        E       obj;
        int     len = size();

        obj = peek();
        removeElementAt(len - 1);

        return obj;
    }

  
    public synchronized E peek() {
        int     len = size();

        if (len == 0)
            throw new EmptyStackException();
        return elementAt(len - 1);
    }

   
    public boolean empty() {
        return size() == 0;
    }

    
    public synchronized int search(Object o) {
        int i = lastIndexOf(o);

        if (i >= 0) {
            return size() - i;
        }
        return -1;
    }

   
    private static final long serialVersionUID = 1224463164541339165L;
}

```